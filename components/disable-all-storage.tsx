"use client";

import { useEffect } from "react";

export function DisableAllStorage() {
  useEffect(() => {
    // PERMANENTLY DISABLE LOCAL STORAGE
    if (typeof window !== "undefined") {
      // Override localStorage setItem to block writes (but allow reads for compatibility)
      try {
        const originalLocalStorageSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key: string, value: string) {
          console.warn('[STORAGE BLOCKED] Prevented localStorage write:', key);
          return; // Block all writes
        };
        
        // Clear existing data
        try {
          localStorage.clear();
        } catch (e) {}
      } catch (e) {
        console.warn('Could not override localStorage');
      }

      // Override sessionStorage setItem to block writes
      try {
        const originalSessionStorageSetItem = sessionStorage.__proto__.setItem;
        sessionStorage.__proto__.setItem = function(key: string, value: string) {
          console.warn('[STORAGE BLOCKED] Prevented sessionStorage write:', key);
          return; // Block all writes
        };
        
        // Clear existing data
        try {
          sessionStorage.clear();
        } catch (e) {}
      } catch (e) {
        console.warn('Could not override sessionStorage');
      }

      // PERMANENTLY DISABLE INDEXEDDB (block open, but keep object intact for compatibility)
      if (window.indexedDB) {
        try {
          const originalIDBOpen = indexedDB.open;
          indexedDB.open = function(...args: any[]) {
            console.warn('[INDEXEDDB BLOCKED] Prevented database creation');
            throw new Error('IndexedDB is disabled');
          };
          
          // Try to delete existing databases
          try {
            if (indexedDB.databases) {
              indexedDB.databases().then((dbs) => {
                dbs.forEach((db) => {
                  if (db.name) {
                    indexedDB.deleteDatabase(db.name);
                  }
                });
              }).catch(() => {});
            }
          } catch (e) {}
        } catch (e) {
          console.warn('Could not override IndexedDB');
        }
      }

      // PERMANENTLY DISABLE CACHE API
      if ("caches" in window) {
        try {
          const originalCachesOpen = caches.open;
          caches.open = function(...args: any[]) {
            console.warn('[CACHE API BLOCKED] Prevented cache creation');
            return Promise.reject(new Error("Cache disabled"));
          };
          
          // Delete existing caches
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.delete(name);
            });
          }).catch(() => {});
        } catch (e) {
          console.warn('Could not override Cache API');
        }
      }

      // PERMANENTLY DISABLE SERVICE WORKER
      if ("serviceWorker" in navigator) {
        try {
          const originalSWRegister = navigator.serviceWorker.register;
          navigator.serviceWorker.register = function(...args: any[]) {
            console.warn('[SERVICE WORKER BLOCKED] Prevented registration');
            return Promise.reject(new Error("Service Worker disabled"));
          };
          
          // Unregister existing service workers
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((registration) => {
              registration.unregister();
            });
          }).catch(() => {});
        } catch (e) {
          console.warn('Could not override Service Worker');
        }
      }

      // OVERRIDE FETCH TO ADD NO-CACHE HEADERS
      const originalFetch = window.fetch;
      window.fetch = function (...args) {
        const [resource, config] = args;
        const newConfig = {
          ...config,
          cache: "no-store" as RequestCache,
          headers: {
            ...((config && config.headers) || {}),
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        };
        return originalFetch(resource, newConfig);
      };

      // OVERRIDE XMLHttpRequest TO PREVENT CACHING
      const originalXHROpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (
        method: string,
        url: string | URL,
        async?: boolean,
        username?: string | null,
        password?: string | null
      ) {
        originalXHROpen.call(this, method, url, async ?? true, username, password);
        this.setRequestHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        this.setRequestHeader("Pragma", "no-cache");
        this.setRequestHeader("Expires", "0");
      };

      // CLEAR ALL EXISTING STORAGE ON LOAD
      try {
        localStorage.clear();
      } catch (e) {}
      
      try {
        sessionStorage.clear();
      } catch (e) {}
      
      try {
        if (window.indexedDB) {
          indexedDB.databases().then((dbs) => {
            dbs.forEach((db) => {
              if (db.name) {
                indexedDB.deleteDatabase(db.name);
              }
            });
          });
        }
      } catch (e) {}

      try {
        if ("caches" in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.delete(name);
            });
          });
        }
      } catch (e) {}

      // UNREGISTER ALL SERVICE WORKERS
      try {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((registration) => {
              registration.unregister();
            });
          });
        }
      } catch (e) {}

      // PREVENT BROWSER BACK/FORWARD CACHE (bfcache)
      window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
          window.location.reload();
        }
      });

      // PREVENT ANY FORM OF STORAGE
      window.addEventListener("storage", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
      });

      // Continuously monitor and clear storage every second
      const storageMonitor = setInterval(() => {
        try {
          if (window.localStorage && window.localStorage.length > 0) {
            window.localStorage.clear();
          }
        } catch (e) {}
        
        try {
          if (window.sessionStorage && window.sessionStorage.length > 0) {
            window.sessionStorage.clear();
          }
        } catch (e) {}
      }, 1000);

      // Clean up on unmount
      return () => {
        clearInterval(storageMonitor);
      };
    }
  }, []);

  return (
    <>
      <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0, private" />
      <meta httpEquiv="Pragma" content="no-cache" />
      <meta httpEquiv="Expires" content="0" />
      <meta httpEquiv="Surrogate-Control" content="no-store" />
      <meta name="cache-control" content="no-cache, no-store, must-revalidate, max-age=0" />
      <meta name="expires" content="0" />
      <meta name="pragma" content="no-cache" />
    </>
  );
}
