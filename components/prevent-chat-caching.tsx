"use client";

import { useEffect } from "react";

export function PreventChatCaching() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // PERMANENTLY BLOCK CHAT MESSAGE CACHING - NOT DELETION, JUST CACHING
    
    // Override localStorage.setItem to block chat-related keys from being cached
    const originalLocalStorageSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key: string, value: string) {
      const lowerKey = key.toLowerCase();
      const chatKeywords = [
        'chat', 'message', 'conversation', 'ai-', 'vercel', 
        'stream', 'history', 'dialog', 'assistant', 'prompt'
      ];
      
      const isChatRelated = chatKeywords.some(keyword => lowerKey.includes(keyword));
      
      if (isChatRelated) {
        console.warn(`[CHAT CACHE BLOCKED] Prevented caching of: ${key}`);
        return; // Block caching, but don't delete from memory
      }
      
      return originalLocalStorageSetItem.call(this, key, value);
    };

    // Override sessionStorage.setItem to block chat-related keys
    const originalSessionStorageSetItem = sessionStorage.__proto__.setItem;
    sessionStorage.__proto__.setItem = function(key: string, value: string) {
      const lowerKey = key.toLowerCase();
      const chatKeywords = [
        'chat', 'message', 'conversation', 'ai-', 'vercel', 
        'stream', 'history', 'dialog', 'assistant', 'prompt'
      ];
      
      const isChatRelated = chatKeywords.some(keyword => lowerKey.includes(keyword));
      
      if (isChatRelated) {
        console.warn(`[CHAT CACHE BLOCKED] Prevented session caching of: ${key}`);
        return;
      }
      
      return originalSessionStorageSetItem.call(this, key, value);
    };

    // Block IndexedDB for chat data
    if (window.indexedDB) {
      const originalIDBOpen = indexedDB.open;
      indexedDB.open = function(name: string, version?: number) {
        const lowerName = name.toLowerCase();
        const chatKeywords = ['chat', 'message', 'conversation', 'ai', 'vercel'];
        
        if (chatKeywords.some(keyword => lowerName.includes(keyword))) {
          console.warn(`[CHAT CACHE BLOCKED] Prevented IndexedDB: ${name}`);
          throw new Error(`Chat caching blocked for: ${name}`);
        }
        
        if (version !== undefined) {
          return originalIDBOpen.call(this, name, version);
        }
        return originalIDBOpen.call(this, name);
      };
    }

    // Add headers to fetch requests for chat endpoints to prevent server-side caching
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const [resource, config] = args;
      let url = '';
      if (typeof resource === 'string') {
        url = resource;
      } else if (resource instanceof Request) {
        url = resource.url;
      } else if (resource instanceof URL) {
        url = resource.toString();
      }
      
      // Check if this is a chat-related API call
      const isChatAPI = url.includes('/chat') || 
                        url.includes('/message') || 
                        url.includes('/conversation') ||
                        url.includes('/api/chat');
      
      if (isChatAPI) {
        const newConfig = {
          ...config,
          cache: "no-store" as RequestCache,
          headers: {
            ...((config && config.headers) || {}),
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-No-Cache": "true",
            "X-Chat-No-Persist": "true",
          },
        };
        return originalFetch(resource, newConfig);
      }
      
      return originalFetch(...args);
    };

    console.log('[CHAT CACHING BLOCKED] All chat message caching permanently disabled');

  }, []);

  return null;
}
