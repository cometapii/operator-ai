"use client";

import { useState, useRef, FormEvent, ChangeEvent } from "react";
import { flushSync } from "react-dom";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts?: any[];
};

type UseChatOptions = {
  api: string;
  body?: Record<string, any>;
  onError?: (error: Error) => void;
};

type ChatStatus = "ready" | "streaming" | "error";

export function useOptimizedChat(options: UseChatOptions) {
  const { api, body, onError } = options;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [, forceUpdate] = useState({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>([]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const append = async ({ role, content }: { role: "user" | "assistant"; content: string }) => {
    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random()}`,
      role,
      content,
    };

    // flushSync: natychmiastowe wyświetlenie wiadomości użytkownika
    flushSync(() => {
      setMessages((prev) => {
        const updated = [...prev, userMessage];
        messagesRef.current = updated;
        return updated;
      });
      setStatus("streaming");
    });

    try {
      abortControllerRef.current = new AbortController();
      const timestamp = Date.now();
      
      const response = await fetch(`${api}?_=${timestamp}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
        body: JSON.stringify({
          messages: messagesRef.current,
          timestamp,
          ...body,
        }),
        signal: abortControllerRef.current.signal,
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";
      let currentTextMessageId: string | null = null;

      // Real-time streaming - proces każdą kompletną linię natychmiast
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Dekoduj natychmiast bez buforowania
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);
            console.log('[CLIENT PARSE]', data.type, Date.now());
            
            // TEXT DELTA - ABSOLUTNIE ZERO BATCHING
            if (data.type === "text-delta") {
              if (!currentTextMessageId) {
                const newMsg: Message = {
                  id: `text-${Date.now()}-${Math.random()}`,
                  role: "assistant",
                  content: data.delta,
                };
                currentTextMessageId = newMsg.id;
                
                // WYMUSZENIE synchronicznego update BEZ batching
                flushSync(() => {
                  messagesRef.current = [...messagesRef.current, newMsg];
                  setMessages([...messagesRef.current]);
                });
                // Dodatkowe wymuszenie rerenderu
                requestAnimationFrame(() => {
                  forceUpdate({});
                });
              } else {
                // NATYCHMIASTOWA aktualizacja - ZERO opóźnień
                flushSync(() => {
                  messagesRef.current = messagesRef.current.map((msg) =>
                    msg.id === currentTextMessageId
                      ? { ...msg, content: msg.content + data.delta }
                      : msg
                  );
                  setMessages([...messagesRef.current]);
                });
                // Dodatkowe wymuszenie rerenderu
                requestAnimationFrame(() => {
                  forceUpdate({});
                });
              }
            }
            
            // TOOL CALL START - ZERO BATCHING
            else if (data.type === "tool-call-start") {
              currentTextMessageId = null;
              const toolMsg: Message = {
                id: `tool-${data.toolCallId}-${Date.now()}`,
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
              
              flushSync(() => {
                messagesRef.current = [...messagesRef.current, toolMsg];
                setMessages([...messagesRef.current]);
              });
              requestAnimationFrame(() => forceUpdate({}));
            }
            
            // TOOL NAME - ZERO BATCHING
            else if (data.type === "tool-name-delta") {
              flushSync(() => {
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
                setMessages([...messagesRef.current]);
              });
              requestAnimationFrame(() => forceUpdate({}));
            }
            
            // TOOL ARGUMENTS - ZERO BATCHING
            else if (data.type === "tool-argument-delta") {
              flushSync(() => {
                messagesRef.current = messagesRef.current.map((msg) => {
                  if (msg.id.includes(data.toolCallId) && msg.parts?.[0]?.type === "tool-invocation") {
                    const currentArgsText = msg.parts[0].toolInvocation.argsText || "";
                    const newArgsText = currentArgsText + data.delta;
                    let parsedArgs = msg.parts[0].toolInvocation.args;
                    try {
                      parsedArgs = JSON.parse(newArgsText);
                    } catch (e) {
                      // Zachowaj stare args dopóki JSON nie jest kompletny
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
                setMessages([...messagesRef.current]);
              });
              requestAnimationFrame(() => forceUpdate({}));
            }
            
            // TOOL INPUT AVAILABLE - ZERO BATCHING
            else if (data.type === "tool-input-available") {
              flushSync(() => {
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
                setMessages([...messagesRef.current]);
              });
              requestAnimationFrame(() => forceUpdate({}));
            }
            
            // TOOL OUTPUT - ZERO BATCHING
            else if (data.type === "tool-output-available") {
              flushSync(() => {
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
                setMessages([...messagesRef.current]);
              });
              requestAnimationFrame(() => forceUpdate({}));
            }
          } catch (e) {
            if (!(e instanceof SyntaxError)) throw e;
          }
        }
      }

      flushSync(() => {
        setStatus("ready");
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatus("ready");
        return;
      }
      
      setStatus("error");
      if (onError && error instanceof Error) {
        onError(error);
      }
      console.error("Chat error:", error);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || status === "streaming") return;

    const userInput = input;
    setInput("");
    await append({ role: "user", content: userInput });
  };

  const stop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus("ready");
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    append,
    setMessages: (msgs: Message[]) => {
      messagesRef.current = msgs;
      setMessages(msgs);
    },
  };
}
