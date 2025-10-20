/**
 * STREAMING CONFIGURATION
 * 
 * Permanentne ustawienia dla real-time streamingu bez buforowania.
 * NIE MODYFIKUJ TEJ KONFIGURACJI - zapewnia prawdziwy real-time streaming.
 */

export const STREAMING_CONFIG = {
  /**
   * REAL-TIME STREAMING BEZ BUFOROWANIA
   * 
   * Każdy event SSE jest przetwarzany natychmiast po otrzymaniu kompletnej linii.
   * Brak sztucznego buforowania - dane renderowane w momencie otrzymania.
   */
  ENABLE_BUFFERING: false,
  
  /**
   * BRAK GRUPOWANIA WIADOMOŚCI
   * 
   * Każda część wiadomości (text, tool-invocation) jest renderowana jako osobny element.
   * Fragmenty NIE są łączone w całość - każdy fragment wyświetlany osobno.
   */
  ENABLE_MESSAGE_GROUPING: false,
  
  /**
   * ELIMINACJA SZTUCZNEGO CHUNKOWANIA
   * 
   * Argumenty narzędzi wysyłane jako kompletny JSON jednorazowo.
   * Brak dzielenia na małe fragmenty (np. po 10 znaków).
   */
  ENABLE_ARGUMENT_CHUNKING: false,
  
  /**
   * CHUNK SIZE (tylko gdy chunking jest włączony)
   * 
   * Domyślnie: 0 (brak chunkowania)
   * Poprzednio było: 10 znaków (usunięte)
   */
  ARGUMENT_CHUNK_SIZE: 0,
  
  /**
   * NATYCHMIASTOWE PRZETWARZANIE
   * 
   * Każda kompletna linia SSE jest parsowana i wyświetlana natychmiast.
   * Brak opóźnień, brak czekania na pełne chunki.
   */
  IMMEDIATE_PROCESSING: true,
  
  /**
   * HTTP HEADERS DLA STREAMINGU
   * 
   * Optymalne nagłówki dla prawdziwego real-time streamingu.
   */
  STREAMING_HEADERS: {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, no-transform, must-revalidate',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'X-Content-Type-Options': 'nosniff',
    'Transfer-Encoding': 'chunked',
  },
} as const;

/**
 * WALIDACJA KONFIGURACJI
 * 
 * Sprawdza czy konfiguracja jest poprawna dla real-time streamingu.
 */
export function validateStreamingConfig(): void {
  if (STREAMING_CONFIG.ENABLE_BUFFERING) {
    throw new Error('BŁĄD: Buforowanie jest włączone! Real-time streaming wymaga ENABLE_BUFFERING: false');
  }
  
  if (STREAMING_CONFIG.ENABLE_MESSAGE_GROUPING) {
    throw new Error('BŁĄD: Grupowanie wiadomości jest włączone! Real-time streaming wymaga ENABLE_MESSAGE_GROUPING: false');
  }
  
  if (STREAMING_CONFIG.ENABLE_ARGUMENT_CHUNKING) {
    throw new Error('BŁĄD: Chunking argumentów jest włączony! Real-time streaming wymaga ENABLE_ARGUMENT_CHUNKING: false');
  }
  
  if (!STREAMING_CONFIG.IMMEDIATE_PROCESSING) {
    throw new Error('BŁĄD: Natychmiastowe przetwarzanie jest wyłączone! Real-time streaming wymaga IMMEDIATE_PROCESSING: true');
  }
}

/**
 * DOKUMENTACJA ZMIAN
 * 
 * Historia modyfikacji dla real-time streamingu:
 * 
 * 1. useCustomChat.ts:
 *    - Usunięto skomplikowany system buforowania
 *    - Każda linia SSE przetwarzana natychmiast (split po \n)
 *    - Tylko niekompletne linie w buferze
 * 
 * 2. app/api/chat/route.ts:
 *    - Usunięto chunking argumentów (było: po 10 znaków)
 *    - Argumenty wysyłane jako kompletny JSON
 *    - Dodano optymalne nagłówki HTTP
 * 
 * 3. components/message.tsx:
 *    - Usunięto grupowanie części wiadomości
 *    - Każda część renderowana jako osobny element (<>...</>)
 *    - Brak łączenia fragmentów w całość
 */

// Walidacja przy imporcie
validateStreamingConfig();
