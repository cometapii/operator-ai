"use client";

import { useState, useRef, useCallback } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts?: any[];
};

type UseRawStreamingOptions = {
  api: string;
  body?: Record<string, any>;
  onError?: (error: Error) => void;
};

export function useRawStreaming(options: UseRawStreamingOptions) {
  const { api, body, onError } = options;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const currentTextIdRef = useRef<string | null>(null);
  const forceUpdateRef = useRef(0);

  const processLine = useCallback((line: string) => {
    if (!line.trim()) return;

    try {
      const data = JSON.parse(line);
      console.log('[STREAMING EVENT]', data.type, new Date().toISOString());

      const now = Date.now();
      let updated = false;

      // TEXT DELTA - NATYCHMIASTOWA AKTUALIZACJA
      if (data.type === "text-delta") {
        if (!currentTextIdRef.current) {
          const newMsg: Message = {
            id: `text-${now}-${Math.random()}`,
            role: "assistant",
            content: data.delta,
          };
          currentTextIdRef.current = newMsg.id;
          messagesRef.current = [...messagesRef.current, newMsg];
        } else {
          messagesRef.current = messagesRef.current.map((msg) =>
            msg.id === currentTextIdRef.current
              ? { ...msg, content: msg.content + data.delta }
              : msg
          );
        }
        updated = true;
      }

      // TOOL CALL START
      else if (data.type === "tool-call-start") {
        currentTextIdRef.current = null;
        const toolMsg: Message = {
          id: `tool-${data.toolCallId}-${now}`,
          role: "assistant",
          content: "",
          parts: [{
            type: "tool-invocation",
            toolInvocation: {
              toolCallId: data.toolCallId,
              toolName: "",
              args: {},
              argsText: "",
              state: "streaming",
            },
          }],
        };
        messagesRef.current = [...messagesRef.current, toolMsg];
        updated = true;
      }

      // TOOL NAME
      else if (data.type === "tool-name-delta") {
        messagesRef.current = messagesRef.current.map((msg) => {
          if (msg.id.includes(data.toolCallId) && msg.parts?.[0]?.type === "tool-invocation") {
            return {
              ...msg,
              parts: [{
                ...msg.parts[0],
                toolInvocation: {
                  ...msg.parts[0].toolInvocation,
                  toolName: data.toolName,
                },
              }],
            };
          }
          return msg;
        });
        updated = true;
      }

      // TOOL ARGUMENTS - KLUCZOWE DLA REAL-TIME STREAMING
      else if (data.type === "tool-argument-delta") {
        messagesRef.current = messagesRef.current.map((msg) => {
          if (msg.id.includes(data.toolCallId) && msg.parts?.[0]?.type === "tool-invocation") {
            const currentArgsText = msg.parts[0].toolInvocation.argsText || "";
            const newArgsText = currentArgsText + data.delta;
            let parsedArgs = msg.parts[0].toolInvocation.args;
            try {
              parsedArgs = JSON.parse(newArgsText);
            } catch (e) {
              // Keep old args
            }
            return {
              ...msg,
              parts: [{
                ...msg.parts[0],
                toolInvocation: {
                  ...msg.parts[0].toolInvocation,
                  argsText: newArgsText,
                  args: parsedArgs,
                },
              }],
            };
          }
          return msg;
        });
        updated = true;
      }

      // TOOL INPUT AVAILABLE
      else if (data.type === "tool-input-available") {
        messagesRef.current = messagesRef.current.map((msg) => {
          if (msg.id.includes(data.toolCallId) && msg.parts?.[0]?.type === "tool-invocation") {
            return {
              ...msg,
              parts: [{
                ...msg.parts[0],
                toolInvocation: {
                  ...msg.parts[0].toolInvocation,
                  args: data.input,
                  state: "call",
                },
              }],
            };
          }
          return msg;
        });
        updated = true;
      }

      // TOOL OUTPUT
      else if (data.type === "tool-output-available") {
        messagesRef.current = messagesRef.current.map((msg) => {
          if (msg.id.includes(data.toolCallId) && msg.parts?.[0]?.type === "tool-invocation") {
            return {
              ...msg,
              parts: [{
                ...msg.parts[0],
                toolInvocation: {
                  ...msg.parts[0].toolInvocation,
                  state: "result",
                  result: data.output,
                },
              }],
            };
          }
          return msg;
        });
        updated = true;
      }

      // FINISH
      else if (data.type === "finish") {
        setIsStreaming(false);
      }

      // ERROR
      else if (data.type === "error") {
        setIsStreaming(false);
        if (onError) {
          onError(new Error(data.errorText || "Streaming error"));
        }
      }

      // NATYCHMIASTOWY RERENDER - ZERO BATCHING
      if (updated) {
        forceUpdateRef.current++;
        // WYMUSZONY SYNCHRONICZNY UPDATE z flushSync
        const newMessages = [...messagesRef.current];
        setMessages(newMessages);
        
        // Dodatkowe wymuszenie rerenderu przez requestAnimationFrame
        requestAnimationFrame(() => {
          setMessages([...messagesRef.current]);
        });
      }

    } catch (e) {
      if (!(e instanceof SyntaxError)) {
        console.error('[PARSE ERROR]', e);
      }
    }
  }, [onError]);

  const send = useCallback(async (userMessage: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: "user",
      content: userMessage,
    };

    messagesRef.current = [...messagesRef.current, userMsg];
    setMessages([...messagesRef.current]);
    setIsStreaming(true);
    currentTextIdRef.current = null;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // FETCH API Z READABLESTREAM - NAJLEPSZE DLA STREAMING
      const response = await fetch(`${api}?_=${Date.now()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        },
        cache: "no-store",
        body: JSON.stringify({
          messages: messagesRef.current,
          timestamp: Date.now(),
          ...body,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      // CZYTAJ STREAM W PĘTLI - REAL-TIME BEZ BUFOROWANIA
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Przetwórz ostatnie dane w buforze
          if (buffer.trim()) {
            processLine(buffer);
          }
          break;
        }

        // NATYCHMIASTOWE PRZETWARZANIE - dekoduj i przetwarzaj każdy chunk
        buffer += decoder.decode(value, { stream: true });
        
        // Podziel na linie i NATYCHMIAST przetwórz
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        // Przetwarzaj każdą linię NATYCHMIAST
        for (const line of lines) {
          if (line.trim()) {
            processLine(line);
            // Wymuś natychmiastowy rerender po każdej linii
            await new Promise(resolve => requestAnimationFrame(resolve));
          }
        }
      }

      setIsStreaming(false);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[STREAMING] Aborted');
      } else {
        console.error('[STREAMING ERROR]', error);
        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
      setIsStreaming(false);
    }
  }, [api, body, processLine, onError]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const userInput = input;
    setInput("");
    send(userInput);
  }, [input, isStreaming, send]);

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isStreaming,
    stop,
    send,
    setMessages: (msgs: Message[]) => {
      messagesRef.current = msgs;
      setMessages(msgs);
    },
  };
}
