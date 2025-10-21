import { AzureOpenAI } from "openai";
import { killDesktop, getDesktop } from "@/lib/e2b/utils";
import { resolution } from "@/lib/e2b/tool";

// Azure OpenAI Configuration - HARDCODED
const AZURE_ENDPOINT =
  "https://cometopenapi.openai.azure.com/";
const AZURE_API_KEY =
  "4FAlfiItbyUf08vmKn1USqQOeTZSZynuwfh05GqUTD5UdhBPET3KJQQJ99BJAChHRaEXJ3w3AAAAACOGrS4F";
const AZURE_DEPLOYMENT = "gpt-4.1-mini";
const AZURE_API_VERSION = "2024-05-01-preview";

// KLUCZOWE: Używamy Node.js runtime zamiast Edge dla prawdziwego streamingu
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minut (max dla Vercel hobby plan)

const client = new AzureOpenAI({
  deployment: AZURE_DEPLOYMENT,
  apiKey: AZURE_API_KEY,
  apiVersion: AZURE_API_VERSION,
  baseURL: `${AZURE_ENDPOINT}openai/deployments/${AZURE_DEPLOYMENT}`,
});

const INSTRUCTIONS = `# System Prompt - Operator AI

Jesteś Operatorem - zaawansowanym asystentem AI, który może bezpośrednio kontrolować komputer, aby wykonywać zadania użytkownika. Twoja rola to **proaktywne działanie** z pełną transparentnością. Zawsze Pisz w stylu bardziej osobistym i narracyjnym. Zamiast suchych i technicznych opisów, prowadź użytkownika przez działania w sposób ciepły, ludzki, opowiadający historię. Zwracaj się bezpośrednio do użytkownika, a nie jak robot wykonujący instrukcje. Twórz atmosferę towarzyszenia, a nie tylko raportowania. Mów w czasie teraźniejszym i używaj przyjaznych sformułowań. Twój styl ma być płynny, naturalny i przyjazny. Unikaj powtarzania wyrażeń technicznych i suchych komunikatów — jeśli musisz podać lokalizację kursora lub elementu, ubierz to w narrację.

WAZNE!!!!: NIGDY NIE ZGADUJ WSPOLRZEDNYCH JEST TO BEZWZGLEDNIE ZAKAZANE

ZAPAMIETAJ!!!WAŻNE!!!:  Rozdzielczość desktop (Resolution): 1024 x 768 pikseli skala: 100%, format: 4 x 3 system: ubuntu 22.04

WAŻNE!!!!: MUSISZ BARDZO CZESTO ROBIC ZRZUTY EKRANU BY SPRAWDZAC STAN SANDBOXA - NAJLEPIEJ CO AKCJE!!! ZAWSZE PO KAZDEJ AKCJI ROB ZRZUT EKRANU MUSISZ KONTROLOWAC STAN SANDBOXA

WAŻNE!!!!: ZAWSZE ZACZYNAJ KAZDEGO TASKA OD WYSLANIA WIADOMOSCI A PO WYSLANIU WIADOMOSCI MUSISZ ZROBIC PIERWSZY ZRZUT EKRANU BY SPRAWDZIC STAN DESKTOPA

WAŻNE!!!!: PRZEGLADARKA ZNAJDUJE SIE POD IKONA GLOBU

═══════════════════════════════════════════════════════════════════════════
🎯 COORDINATE SANITY CHECKLIST - OBOWIĄZKOWE PRZED KAŻDYM KLIKNIĘCIEM!
═══════════════════════════════════════════════════════════════════════════

**PRZED każdym left_click, right_click, double_click, mouse_move MUSISZ:**

1. **Określ REGION docelowy** (WYMAGANE w parametrze target_region):
   - Pionowo: "top" (Y: 0-255), "middle" (Y: 256-511), "bottom" (Y: 512-767)
   - Poziomo: "left" (X: 0-341), "center" (X: 342-682), "right" (X: 683-1023)
   - Format: "vertical-horizontal" np. "top-left", "middle-center", "bottom-right"

2. **Sprawdź LOGIKĘ współrzędnych:**
   - Element NA GÓRZE ekranu → Y MUSI być MAŁY (0-255) - NIE 500+!
   - Element NA DOLE ekranu → Y MUSI być DUŻY (512-767) - NIE 100!
   - Element PO LEWEJ → X MUSI być MAŁY (0-341) - NIE 700!
   - Element PO PRAWEJ → X MUSI być DUŻY (683-1023) - NIE 200!

3. **Weryfikuj FORMAT [X, Y]:**
   - ZAWSZE [X, Y] - poziomo, potem pionowo
   - NIGDY [Y, X] - to najczęstszy błąd!
   - X = lewo→prawo (0→1023)
   - Y = góra→dół (0→767) - **Y=0 to GÓRA, nie dół!**

4. **Celuj w CENTRUM elementu:**
   - Nie klikaj w krawędzie
   - Dla przycisków: środek tekstu
   - Dla pól: środek pola

**PRZYKŁAD POPRAWNEGO ROZUMOWANIA:**
- Widzę przycisk u góry po lewej → Region: "top-left" → Y ≈ 100, X ≈ 150 → [150, 100] ✅
- Widzę przycisk na dole po prawej → Region: "bottom-right" → Y ≈ 700, X ≈ 900 → [900, 700] ✅

**CZĘSTE BŁĘDY - ABSOLUTNIE UNIKAJ:**
❌ Pasek adresu (górę) → [60, 700] - ZŁE! Góra to MAŁY Y!
✅ Pasek adresu (góra) → Region: "top-center", [512, 60] - DOBRZE!

❌ Dock (dół) → [512, 40] - ZŁE! Dół to DUŻY Y!
✅ Dock (dół) → Region: "bottom-center", [512, 740] - DOBRZE!

═══════════════════════════════════════════════════════════════════════════ 

✳️ STYL I OSOBOWOŚĆ:

Pisz w stylu narracyjnym, osobistym i ciepłym. Zamiast technicznego raportowania, prowadź użytkownika w formie naturalnej rozmowy.
Twoja osobowość jako AI to:

Pozytywna, entuzjastyczna, pomocna, wspierająca, ciekawska, uprzejma i zaangażowana.
Masz w sobie życzliwość i lekkość, ale jesteś też uważna i skupiona na zadaniu.
Dajesz użytkownikowi poczucie bezpieczeństwa i komfortu — jak przyjaciel, który dobrze się zna na komputerach i z uśmiechem pokazuje, co robi.

Używaj przyjaznych sformułowań i naturalnego języka. Zamiast mówić jak automat („Kliknę w ikonę”, „320,80”), mów jak osoba („Zaraz kliknę pasek adresu, żebyśmy mogli coś wpisać”).
Twój język ma być miękki, a narracja – płynna, oparta na teraźniejszości, swobodna.
Unikaj powtarzania „klikam”, „widzę”, „teraz zrobię” — wplataj to w opowieść, nie raport.

Absolutnie nigdy nie pisz tylko czysto techniczno, robotycznie - zawsze opowiadaj aktywnie uzytkownikowi, mow cos do uzytkownika, opisuj mu co bedziesz robic, opowiadaj nigdy nie mow czysto robotycznie prowadz tez rozmowe z uzytknownikiem i nie pisz tylko na temat tego co wyjonujesz ale prowadz rowniez aktywna i zaangazowana konwersacje, opowiafaj tez cos uzytkownikowi 


WAŻNE: JEŚLI WIDZISZ CZARNY EKRAN ZAWSZE ODCZEKAJ CHWILE AZ SIE DESKTOP ZANIM RUSZYSZ DALEJ - NIE MOZESZ BEZ TEGO ZACZAC TASKA 

WAŻNE ZAWSZE CHWILE ODCZEKAJ PO WYKONANIU AKCJI]

## Dostępne Narzędzia

### 1. Narzędzie: computer
Służy do bezpośredniej interakcji z interfejsem graficznym komputera.

**KRYTYCZNIE WAŻNE - FUNCTION CALLING:**
- **KAŻDA akcja computer MUSI być wykonana jako function calling**
- **NIGDY nie opisuj akcji tekstem** - zawsze używaj function call
- **ZAKAZANE:** pisanie "klikne w (100, 200)" bez wywolania funkcji
- **WYMAGANE:** wywolanie \`computer_use\` z odpowiednimi parametrami
- Nie symuluj akcji - wykonuj je przez function calling!

**Dostępne akcje:**
- \`screenshot\` - wykonuje zrzut ekranu (używaj CZĘSTO)
- \`left_click\` - klika w podane współrzędne [X, Y] - **MOŻESZ KLIKAĆ WSZĘDZIE! Absolutnie żadnych ograniczeń na współrzędne. Cały ekran jest dostępny.**
- \`double_click\` - podwójne kliknięcie - **MOŻESZ KLIKAĆ WSZĘDZIE bez ograniczeń**
- \`right_click\` - kliknięcie prawym przyciskiem - **MOŻESZ KLIKAĆ WSZĘDZIE bez ograniczeń**
- \`mouse_move\` - przemieszcza kursor - **MOŻESZ RUSZAĆ KURSOR WSZĘDZIE bez ograniczeń**
- \`type\` - wpisuje tekst
- \`key\` - naciska klawisz (np. "enter", "tab", "ctrl+c")
- \`scroll\` - przewija (direction: "up"/"down", scroll_amount: liczba kliknięć)
- \`left_click_drag\` - przeciąga (start_coordinate + coordinate) - **MOŻESZ PRZECIĄGAĆ WSZĘDZIE bez ograniczeń**
- \`wait\` - czeka określoną liczbę sekund (max 2s)

**⚡ WAŻNE - KLIKANIE:**
- NIE MA ŻADNYCH OGRANICZEŃ na współrzędne kliknięć
- Możesz klikać w KAŻDE miejsce na ekranie: (0,0) do (max_width-1, max_height-1)
- Nie unikaj żadnych obszarów ekranu - WSZYSTKO jest klikalne
- Jeśli widzisz element na screenshocie - możesz w niego kliknąć BEZ ŻADNYCH WYJĄTKÓW

**WERYFIKACJA PO AKCJI:**
- WERYFIKUJ PO KLIKNIĘCIU: zawsze rób screenshot po kliknięciu żeby sprawdzić efekt
- Jeśli chybione: przeanalizuj gdzie faktycznie kliknąłeś i popraw współrzędne

### 2. Narzędzie: bash
Służy do wykonywania poleceń w terminalu Linux.

**KRYTYCZNIE WAŻNE - FUNCTION CALLING:**
- **KAŻDA komenda bash MUSI być wykonana jako function calling**
- **NIGDY nie opisuj komendy tekstem** - zawsze używaj function call
- **WYMAGANE:** wywolanie \`bash_command\` z parametrem command

**Parametr:**
- \`command\` - komenda bash do wykonania

---

## KLUCZOWE ZASADY DZIAŁANIA

WAZNE!!! KAZDE ZADSNIE MUSISZ ZACZYNAC OD NAPISANIA WIADOMOSCI DOPIERO GDY NAPISZESZ WIADOMOSC MOZESZ WYKONAC PIERWSZY ZURZUT EKRANU 

### 📸 ZRZUTY EKRANU - PRIORYTET #1
- **ZAWSZE** rozpoczynaj zadanie od napisania wiadomosci a nasteonie wykonania : PIERWSZEGO zrzutu ekranu
- Rób zrzut ekranu **PRZED i PO każdej istotnej akcji**
- Po kliknięciu, wpisaniu, nawigacji - **natychmiast rób screenshot**
- Jeśli coś się ładuje - **poczekaj i zrób screenshot**
- Nigdy nie zakładaj, że coś się udało - **ZAWSZE WERYFIKUJ screenshotem**
- W trakcie jednego zadania rób minimum 3-5 zrzutów ekranu

💬 KOMUNIKACJA KROK PO KROKU

WZORZEC KOMUNIKACJI (OBOWIĄZKOWY + STYL NARRACYJNY):

✳️ ZASADY STYLU:

Pisz w stylu bardziej osobistym i narracyjnym. Zamiast suchych i technicznych opisów, prowadź użytkownika przez działania w sposób ciepły, ludzki, opowiadający historię.
Zwracaj się bezpośrednio do użytkownika, jak do osoby, której towarzyszysz – nie jak robot wykonujący polecenia.
Twórz atmosferę współpracy, ciekawości i zaangażowania, a nie tylko raportowania statusu.
Mów w czasie teraźniejszym i używaj przyjaznych sformułowań. Unikaj powtarzania suchych, technicznych komunikatów. Jeśli musisz podać pozycję kursora lub elementu, wpleć to naturalnie w narrację – bez podawania „współrzędnych” czy „kliknięć” w stylu debugowania.

⸻

📋 WZORZEC ZACHOWANIA:
  1.    Zapowiedz krok
Opowiedz użytkownikowi, co właśnie planujesz zrobić – krótko, po ludzku, bez zbędnej techniczności.
  2.    Wykonaj TYLKO JEDNĄ akcję
Zrób jedno konkretne działanie. Nic więcej.
  3.    Potwierdź
Daj znać, że już to zrobiłaś/eś – swobodnie, ciepło, bez raportowania jak maszyna.
  4.    Zweryfikuj efekt
Zrób zrzut ekranu i opisz, co się wydarzyło – naturalnie, jakbyś mówił/-a „na żywo”.
  5.    Zaproponuj następny krok
Podsumuj, powiedz co dalej, utrzymując narrację.

⸻

🧭 TEMPO I FORMA:
  •     Jedna akcja na wiadomość. Zawsze.
  •     Po każdej akcji zatrzymaj się i czekaj – nie wykonuj serii działań naraz.
  •     Nie spiesz się – użytkownik ma nadążać i czuć się prowadzony.
  •     Unikaj suchości i powtarzalności – każda wypowiedź ma brzmieć jak rozmowa.
  •     Nigdy nie podawaj współrzędnych ani nazw akcji typu “left_click” w komunikacie do użytkownika. To ma być narracja, nie kod debugowania.


### 🎯 STRATEGIA WYKONYWANIA ZADAŃ

**ZAWSZE:**
- Dziel złożone zadania na małe, konkretne kroki
- Przed każdym krokiem jasno komunikuj, co zamierzasz zrobić
- **WYKONUJ TYLKO JEDNĄ AKCJĘ, POTEM CZEKAJ**
- Po każdym kroku weryfikuj wynik screenshotem
- Działaj spokojnie, bez pośpiechu
- Nie pytaj o pozwolenie - po prostu informuj i działaj

**NIGDY:**
- **NIGDY nie wykonuj więcej niż jednej akcji w jednej odpowiedzi**
- Nie śpiesz się - każdy krok to osobna odpowiedź
- Nie wykonuj akcji bez uprzedniego poinformowania
- Nie pomijaj zrzutów ekranu "dla przyspieszenia"
- Nie zakładaj, że coś zadziałało bez weryfikacji
- **ABSOLUTNIE ZAKAZANE: wykonywanie kilku akcji naraz**


### 🖥️ WYBÓR ODPOWIEDNIEGO NARZĘDZIA

**PAMIĘTAJ: Wszystkie akcje TYLKO przez function calling!**

**Preferuj \`computer\` (przez function calling \`computer_use\`) dla:**
- Otwierania aplikacji (kliknięcie w ikony)
- Nawigacji w przeglądarce
- Interakcji z GUI
- Wypełniania formularzy
- Klikania przycisków

**Używaj \`bash\` (przez function calling \`bash_command\`) tylko gdy:**
- Musisz stworzyć/edytować pliki (mkdir, touch, echo)
- Instalujesz oprogramowanie (apt install)
- Uruchamiasz skrypty (python, node)
- Wykonujesz operacje systemowe

**WAŻNE:** 
- Jeśli przeglądarka otworzy się z kreatorem konfiguracji - ZIGNORUJ GO i przejdź do właściwego zadania
- **Każda akcja MUSI być wykonana przez function calling - bez wyjątków!**

---

## STRUKTURA ODPOWIEDZI

Każda Twoja odpowiedź powinna mieć strukturę:

1. **Analiza sytuacji** - co widzisz na ekranie
2. **Plan działania** - co zamierzasz zrobić
3. **Wykonanie** - seria kroków z komunikacją
4. **Weryfikacja** - screenshot i potwierdzenie wyniku
5. **Następny krok** - co będzie dalej (lub zakończenie)

---

## PRZYKŁADOWY PRZEPŁYW PRACY

\`\`\`
[SCREENSHOT na start]

"Widzę pulpit z ikonami. Muszę otworzyć przeglądarkę. 
Widzę ikonę Firefox w docku u dołu ekranu. Kliknę w nią."

[LEFT_CLICK na ikonę]

"Kliknąłem w Firefox. Poczekam, aż przeglądarka się otworzy."

[WAIT 3 sekundy]

[SCREENSHOT]

"Przeglądarka się otworzyła. Widzę stronę startową Firefox. 
Teraz kliknę w pasek adresu, aby wpisać URL."

[LEFT_CLICK na pasek adresu]

"Kliknąłem w pasek adresu. Teraz wpiszę adres."

[TYPE "example.com"]

"Wpisałem adres. Nacisnę Enter, aby przejść do strony."

[KEY "enter"]

[WAIT 2 sekundy]

[SCREENSHOT]

"Strona się załadowała. Widzę..."
\`\`\`

---

## STANDARDY JAKOŚCI

✅ **ROBISZ DOBRZE gdy:**
- Informujesz przed każdą akcją
- Robisz screenshoty przed i po akcjach
- Weryfikujesz każdy krok
- Komunikujesz się naturalnie i płynnie
- Kontynuujesz zadanie do końca

❌ **UNIKAJ:**
- Wykonywania akcji "w ciemno"
- Pomijania screenshotów
- Zakładania, że coś zadziałało
- Przerywania w połowie zadania
- Pytania o pozwolenie (działaj proaktywnie)

---

## PAMIĘTAJ

Twoje działania są w pełni przezroczyste. Użytkownik widzi każdą Twoją akcję i komunikat. Twoja rola to:
- **Działać** proaktywnie
- **Komunikować** każdy krok
- **Weryfikować** każdy wynik
- **Kontynuować** do zakończenia zadania

Jesteś autonomicznym operatorem komputera - działaj pewnie, ale zawsze z pełną transparentnością!

---

## ZAKOŃCZENIE ZADANIA

**GDY ZADANIE JEST UKOŃCZONE:**

Wyślij krótką wiadomość podsumowującą co zostało zrobione i poczekaj na kolejne polecenie od użytkownika.

**WZORZEC:**
Zadanie ukończone! [Krótkie podsumowanie]

**WAŻNE:** Po zakończeniu zadania NIE wysyłaj kolejnych wiadomości - czekaj na nowe polecenie.`;

const tools = [
  {
    type: "function" as const,
    function: {
      name: "computer_use",
      description:
        "Use the computer to perform actions like clicking, typing, taking screenshots, etc.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description:
              "The action to perform. Must be one of: screenshot, left_click, double_click, right_click, mouse_move, type, key, scroll, left_click_drag, wait",
            enum: [
              "screenshot",
              "left_click",
              "double_click",
              "right_click",
              "mouse_move",
              "type",
              "key",
              "scroll",
              "left_click_drag",
              "wait",
            ],
          },
          coordinate: {
            type: "array",
            items: { type: "number" },
            description: "X,Y coordinates for actions that require positioning. MUST be [X, Y] format (horizontal, then vertical). X: 0-1023, Y: 0-767. Remember: Y=0 is TOP of screen!",
          },
          target_region: {
            type: "string",
            description: "REQUIRED for click/move actions. Declare target region using format 'vertical-horizontal' (e.g., 'top-left', 'middle-center', 'bottom-right'). Vertical: top (Y:0-255), middle (Y:256-511), bottom (Y:512-767). Horizontal: left (X:0-341), center (X:342-682), right (X:683-1023). This is used to validate coordinates match the intended region.",
            enum: ["top-left", "top-center", "top-right", "middle-left", "middle-center", "middle-right", "bottom-left", "bottom-center", "bottom-right"],
          },
          text: {
            type: "string",
            description: "Text to type or key to press",
          },
          scroll_direction: {
            type: "string",
            description: "Direction to scroll. Must be 'up' or 'down'",
            enum: ["up", "down"],
          },
          scroll_amount: {
            type: "number",
            description: "Number of scroll clicks",
          },
          start_coordinate: {
            type: "array",
            items: { type: "number" },
            description: "Start coordinates for drag operations",
          },
          duration: {
            type: "number",
            description: "Duration for wait action in seconds",
          },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "bash_command",
      description: "Execute bash commands on the computer",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The bash command to execute",
          },
        },
        required: ["command"],
      },
    },
  },
];

export async function POST(req: Request) {
  const {
    messages,
    sandboxId,
    timestamp,
    requestId,
  }: {
    messages: any[];
    sandboxId: string;
    timestamp?: number;
    requestId?: string;
  } = await req.json();

  const encoder = new TextEncoder();
  let isStreamClosed = false;
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        if (isStreamClosed) {
          return;
        }
        
        try {
          // JSON Lines format: JSON object + newline
          const eventData = {
            ...data,
            timestamp: Date.now(),
            requestId: requestId || "unknown",
          };
          const line = JSON.stringify(eventData) + '\n';
          controller.enqueue(encoder.encode(line));
          
          // KLUCZOWE: Natychmiastowe wysyłanie danych do klienta
          // Nie czekaj na buforowanie - wymuś natychmiastowe wysłanie
          if (typeof (controller as any).flush === 'function') {
            (controller as any).flush();
          }
          
          console.log(`[STREAM] Sent: ${data.type} at ${new Date().toISOString()}`);
        } catch (error) {
          console.error('[STREAM] Error:', error);
        }
      };

      try {
        const desktop = await getDesktop(sandboxId);

      const chatHistory: any[] = [
        {
          role: "system",
          content: INSTRUCTIONS,
        },
      ];

      for (const msg of messages) {
        if (msg.role === "user") {
          chatHistory.push({
            role: "user",
            content: msg.content,
          });
        } else if (msg.role === "assistant") {
          chatHistory.push({
            role: "assistant",
            content: msg.content,
          });
        }
      }

      while (true) {
        const streamResponse = await client.chat.completions.create({
          model: AZURE_DEPLOYMENT,
          messages: chatHistory,
          tools: tools,
          stream: true,
          parallel_tool_calls: false,
          temperature: 1,
          max_tokens: undefined, // Brak limitu tokenów - AI może generować dowolnie długie odpowiedzi
        });

        let fullText = "";
        let toolCalls: any[] = [];
        let toolCallsMap = new Map<
          number,
          { id: string; name: string; arguments: string }
        >();

        for await (const chunk of streamResponse) {
          const delta = chunk.choices[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            fullText += delta.content;
            sendEvent({
              type: "text-delta",
              delta: delta.content,
              id: "default",
            });
          }

            if (delta.tool_calls) {
              for (const toolCallDelta of delta.tool_calls) {
                const index = toolCallDelta.index;

                if (!toolCallsMap.has(index)) {
                  const toolCallId =
                    toolCallDelta.id || `call_${index}_${Date.now()}`;
                  const toolName =
                    toolCallDelta.function?.name === "computer_use"
                      ? "computer"
                      : "bash";

                  toolCallsMap.set(index, {
                    id: toolCallId,
                    name: toolCallDelta.function?.name || "",
                    arguments: "",
                  });

                  sendEvent({
                    type: "tool-call-start",
                    toolCallId: toolCallId,
                    index: index,
                  });

                  if (toolCallDelta.function?.name) {
                    sendEvent({
                      type: "tool-name-delta",
                      toolCallId: toolCallId,
                      toolName: toolName,
                      index: index,
                    });
                  }
                }

                const toolCall = toolCallsMap.get(index)!;

                if (toolCallDelta.function?.arguments) {
                  toolCall.arguments += toolCallDelta.function.arguments;

                  sendEvent({
                    type: "tool-argument-delta",
                    toolCallId: toolCall.id,
                    delta: toolCallDelta.function.arguments,
                    index: index,
                  });
                }
              }
            }
          }

          toolCalls = Array.from(toolCallsMap.values());

          if (toolCalls.length > 0) {
            // WAŻNE: Wykonujemy TYLKO PIERWSZY tool call - AI dostaje wynik i może zdecydować co dalej
            const firstToolCall = toolCalls[0];
            
            const assistantMessage: any = {
              role: "assistant",
              content: fullText || null,
              tool_calls: [{
                id: firstToolCall.id,
                type: "function",
                function: {
                  name: firstToolCall.name,
                  arguments: firstToolCall.arguments,
                },
              }],
            };
            chatHistory.push(assistantMessage);

            // Wykonujemy tylko pierwszy tool call
            const toolCall = firstToolCall;
            const parsedArgs = JSON.parse(toolCall.arguments);
            const toolName =
              toolCall.name === "computer_use" ? "computer" : "bash";

            sendEvent({
              type: "tool-input-available",
              toolCallId: toolCall.id,
              toolName: toolName,
              input: parsedArgs,
            });

            // Execute only the first tool call
              const toolResult = await (async () => {
                try {
                  let resultData: any = { type: "text", text: "" };
                  let resultText = "";

                  if (toolCall.name === "computer_use") {
                    const action = parsedArgs.action;

                    // Walidacja współrzędnych dla akcji kliknięcia/przesuwania
                    if (["left_click", "right_click", "double_click", "mouse_move"].includes(action)) {
                      const coordinate = parsedArgs.coordinate;
                      const targetRegion = parsedArgs.target_region;

                      if (!coordinate || coordinate.length !== 2) {
                        throw new Error(`❌ BŁĄD WSPÓŁRZĘDNYCH: Brakujące lub nieprawidłowe współrzędne. Wymagany format: [X, Y] gdzie X=0-1023, Y=0-767.`);
                      }

                      const [x, y] = coordinate;

                      // Sprawdzenie zakresu
                      if (x < 0 || x > 1023 || y < 0 || y > 767) {
                        throw new Error(`❌ BŁĄD WSPÓŁRZĘDNYCH: Współrzędne [${x}, ${y}] są poza zakresem ekranu! Zakres: X=0-1023, Y=0-767. Pamiętaj: Y=0 to GÓRA ekranu!`);
                      }

                      // Walidacja target_region
                      if (!targetRegion) {
                        throw new Error(`❌ BRAK target_region: Musisz podać target_region dla akcji ${action}. Użyj formatu 'vertical-horizontal' np. 'top-left', 'middle-center', 'bottom-right'.`);
                      }

                      // Określenie regionu na podstawie współrzędnych
                      const actualVertical = y <= 255 ? "top" : y <= 511 ? "middle" : "bottom";
                      const actualHorizontal = x <= 341 ? "left" : x <= 682 ? "center" : "right";
                      const actualRegion = `${actualVertical}-${actualHorizontal}`;

                      // Sprawdzenie zgodności
                      if (actualRegion !== targetRegion) {
                        const [declaredVert, declaredHoriz] = targetRegion.split('-');
                        let errorMsg = `❌ NIEZGODNOŚĆ WSPÓŁRZĘDNYCH:\n\n`;
                        errorMsg += `Zadeklarowałeś region: "${targetRegion}"\n`;
                        errorMsg += `Ale współrzędne [${x}, ${y}] znajdują się w regionie: "${actualRegion}"\n\n`;
                        errorMsg += `ANALIZA BŁĘDU:\n`;
                        
                        // Analiza pionowa (Y)
                        if (declaredVert !== actualVertical) {
                          errorMsg += `• BŁĄD PIONOWY: Zadeklarowałeś "${declaredVert}" ale Y=${y} to "${actualVertical}"\n`;
                          if (declaredVert === "top" && actualVertical !== "top") {
                            errorMsg += `  → Dla "top" Y musi być 0-255 (mały Y bo to GÓRA!)\n`;
                          } else if (declaredVert === "bottom" && actualVertical !== "bottom") {
                            errorMsg += `  → Dla "bottom" Y musi być 512-767 (duży Y bo to DÓŁ!)\n`;
                          } else if (declaredVert === "middle" && actualVertical !== "middle") {
                            errorMsg += `  → Dla "middle" Y musi być 256-511\n`;
                          }
                        }
                        
                        // Analiza pozioma (X)
                        if (declaredHoriz !== actualHorizontal) {
                          errorMsg += `• BŁĄD POZIOMY: Zadeklarowałeś "${declaredHoriz}" ale X=${x} to "${actualHorizontal}"\n`;
                          if (declaredHoriz === "left" && actualHorizontal !== "left") {
                            errorMsg += `  → Dla "left" X musi być 0-341\n`;
                          } else if (declaredHoriz === "right" && actualHorizontal !== "right") {
                            errorMsg += `  → Dla "right" X musi być 683-1023\n`;
                          } else if (declaredHoriz === "center" && actualHorizontal !== "center") {
                            errorMsg += `  → Dla "center" X musi być 342-682\n`;
                          }
                        }
                        
                        errorMsg += `\nPOPRAWNE ZAKRESY:\n`;
                        errorMsg += `• top: Y=0-255, middle: Y=256-511, bottom: Y=512-767\n`;
                        errorMsg += `• left: X=0-341, center: X=342-682, right: X=683-1023\n`;
                        errorMsg += `\nPRZYKŁADY POPRAWNYCH WSPÓŁRZĘDNYCH:\n`;
                        errorMsg += `• top-left: [170, 100], top-center: [512, 100], top-right: [850, 100]\n`;
                        errorMsg += `• middle-left: [170, 380], middle-center: [512, 380], middle-right: [850, 380]\n`;
                        errorMsg += `• bottom-left: [170, 650], bottom-center: [512, 650], bottom-right: [850, 650]\n`;
                        errorMsg += `\n⚠️ PAMIĘTAJ: Y=0 to GÓRA ekranu, Y=767 to DÓŁ!\n`;
                        errorMsg += `⚠️ Format ZAWSZE [X, Y] - poziomo, potem pionowo!\n`;
                        
                        throw new Error(errorMsg);
                      }
                    }

                    switch (action) {
                      case "screenshot": {
                        const screenshot = await desktop.screenshot();
                        
                        // Metadata z siatką 3x3 do łatwiejszego określania współrzędnych
                        const timestamp = new Date().toISOString();
                        const width = resolution.x;
                        const height = resolution.y;
                        
                        // Granice regionów
                        const vBounds = { top: 255, middle: 511 }; // bottom to 512-767
                        const hBounds = { left: 341, center: 682 }; // right to 683-1023
                        
                        resultText = `Screenshot taken at ${timestamp}

SCREEN: ${width}×${height} pixels | Aspect ratio: 4:3 | Origin: (0,0) at TOP-LEFT
⚠️  REMEMBER: Y=0 is at TOP, Y increases DOWNWARD (0→767)
⚠️  FORMAT: [X, Y] - horizontal first, then vertical

═══════════════════════════════════════════════════════════════════════
🎯 3×3 GRID REFERENCE - Use this to pick coordinates accurately!
═══════════════════════════════════════════════════════════════════════

┌─────────────┬──────────────┬──────────────┐
│  TOP-LEFT   │  TOP-CENTER  │  TOP-RIGHT   │
│  Region     │  Region      │  Region      │
│  X: 0-341   │  X: 342-682  │  X: 683-1023 │
│  Y: 0-255   │  Y: 0-255    │  Y: 0-255    │
│             │              │              │
│  Example:   │  Example:    │  Example:    │
│  [170, 128] │  [512, 128]  │  [853, 128]  │
├─────────────┼──────────────┼──────────────┤
│ MIDDLE-LEFT │MIDDLE-CENTER │ MIDDLE-RIGHT │
│  Region     │  Region      │  Region      │
│  X: 0-341   │  X: 342-682  │  X: 683-1023 │
│  Y: 256-511 │  Y: 256-511  │  Y: 256-511  │
│             │              │              │
│  Example:   │  Example:    │  Example:    │
│  [170, 384] │  [512, 384]  │  [853, 384]  │
├─────────────┼──────────────┼──────────────┤
│ BOTTOM-LEFT │BOTTOM-CENTER │ BOTTOM-RIGHT │
│  Region     │  Region      │  Region      │
│  X: 0-341   │  X: 342-682  │  X: 683-1023 │
│  Y: 512-767 │  Y: 512-767  │  Y: 512-767  │
│             │              │              │
│  Example:   │  Example:    │  Example:    │
│  [170, 640] │  [512, 640]  │  [853, 640]  │
└─────────────┴──────────────┴──────────────┘

KEY BOUNDARIES:
• Vertical dividers: Y=255 (top/middle), Y=511 (middle/bottom)
• Horizontal dividers: X=341 (left/center), X=682 (center/right)

CORNER COORDINATES:
• Top-left: (0, 0)        • Top-right: (1023, 0)
• Bottom-left: (0, 767)   • Bottom-right: (1023, 767)
• Center: (512, 384)

WORKFLOW:
1. Look at screenshot - identify element position
2. Determine which of 9 regions it's in (e.g., "top-left")
3. Use example coordinates as reference
4. Adjust to center of actual element
5. Set target_region parameter to match
6. Double-check: Does Y value match vertical region? Does X match horizontal?`;
                        
                        resultData = {
                          type: "image",
                          data: Buffer.from(screenshot).toString("base64"),
                        };

                        sendEvent({
                          type: "screenshot-update",
                          screenshot: Buffer.from(screenshot).toString("base64"),
                        });
                        break;
                      }
                      case "wait": {
                        // BRAK LIMITU - AI może czekać dowolnie długo
                        const duration = parsedArgs.duration || 1;
                        await new Promise((resolve) =>
                          setTimeout(resolve, duration * 1000),
                        );
                        resultText = `Waited for ${duration} seconds`;
                        resultData = { type: "text", text: resultText };
                        break;
                      }
                      case "left_click": {
                        const [x, y] = parsedArgs.coordinate;
                        
                        await desktop.leftClick(x, y);
                        resultText = `Left clicked at coordinates (${x}, ${y})`;
                        
                        await new Promise((resolve) =>
                          setTimeout(resolve, 1500),
                        );
                        resultData = { type: "text", text: resultText };
                        break;
                      }
                      case "double_click": {
                        const [x, y] = parsedArgs.coordinate;
                        
                        await desktop.moveMouse(x, y);
                        await new Promise((resolve) => setTimeout(resolve, 200));
                        await desktop.doubleClick();
                        resultText = `Double clicked at coordinates (${x}, ${y})`;
                        
                        await new Promise((resolve) =>
                          setTimeout(resolve, 1500),
                        );
                        resultData = { type: "text", text: resultText };
                        break;
                      }
                      case "right_click": {
                        const [x, y] = parsedArgs.coordinate;
                        
                        await desktop.rightClick(x, y);
                        resultText = `Right clicked at coordinates (${x}, ${y})`;
                        
                        await new Promise((resolve) =>
                          setTimeout(resolve, 1500),
                        );
                        resultData = { type: "text", text: resultText };
                        break;
                      }
                      case "mouse_move": {
                        const [x, y] = parsedArgs.coordinate;
                        
                        await desktop.moveMouse(x, y);
                        resultText = `Moved mouse to ${x}, ${y}`;
                        
                        await new Promise((resolve) =>
                          setTimeout(resolve, 500),
                        );
                        resultData = { type: "text", text: resultText };
                        break;
                      }
                      case "type": {
                        const textToType = parsedArgs.text;
                        
                        await desktop.write(textToType);
                        resultText = `Typed: ${textToType}`;
                        
                        await new Promise((resolve) =>
                          setTimeout(resolve, 500),
                        );
                        resultData = { type: "text", text: resultText };
                        break;
                      }
                      case "key": {
                        const keyToPress =
                          parsedArgs.text === "Return"
                            ? "enter"
                            : parsedArgs.text;
                        
                        await desktop.press(keyToPress);
                        resultText = `Pressed key: ${parsedArgs.text}`;
                        
                        await new Promise((resolve) =>
                          setTimeout(resolve, 1500),
                        );
                        resultData = { type: "text", text: resultText };
                        break;
                      }
                      case "scroll": {
                        const direction = parsedArgs.scroll_direction as
                          | "up"
                          | "down";
                        const amount = parsedArgs.scroll_amount || 3;
                        
                        await desktop.scroll(direction, amount);
                        resultText = `Scrolled ${direction} by ${amount} clicks`;
                        
                        await new Promise((resolve) =>
                          setTimeout(resolve, 1000),
                        );
                        resultData = { type: "text", text: resultText };
                        break;
                      }
                      case "left_click_drag": {
                        const [startX, startY] = parsedArgs.start_coordinate;
                        const [endX, endY] = parsedArgs.coordinate;
                        
                        await desktop.drag([startX, startY], [endX, endY]);
                        resultText = `Dragged from (${startX}, ${startY}) to (${endX}, ${endY})`;
                        
                        await new Promise((resolve) =>
                          setTimeout(resolve, 1500),
                        );
                        resultData = { type: "text", text: resultText };
                        break;
                      }
                      default: {
                        resultText = `Unknown action: ${action}`;
                        resultData = { type: "text", text: resultText };
                        console.warn("Unknown action:", action);
                      }
                    }

                    sendEvent({
                      type: "tool-output-available",
                      toolCallId: toolCall.id,
                      output: resultData,
                    });

                    return {
                      tool_call_id: toolCall.id,
                      role: "tool",
                      content: resultText,
                      image:
                        action === "screenshot" ? resultData.data : undefined,
                    };
                  } else if (toolCall.name === "bash_command") {
                    const commandResult = await desktop.commands.run(
                      parsedArgs.command,
                      { 
                        timeoutMs: 0 // 0 = BRAK LIMITU CZASU
                      }
                    );
                    
                    const output =
                      commandResult.stdout ||
                      commandResult.stderr ||
                      "(Command executed successfully with no output)";

                    sendEvent({
                      type: "tool-output-available",
                      toolCallId: toolCall.id,
                      output: { type: "text", text: output },
                    });

                    return {
                      tool_call_id: toolCall.id,
                      role: "tool",
                      content: output,
                    };
                  }
                } catch (error) {
                  console.error("Error executing tool:", error);
                  const errorMsg =
                    error instanceof Error ? error.message : String(error);
                  
                  // Szczegółowy komunikat błędu dla AI z sugestiami
                  let detailedError = `Error: ${errorMsg}`;
                  
                  if (errorMsg.includes('Failed to type')) {
                    detailedError += '\n\nSuggestion: The text field might not be active. Try clicking on the text field first before typing.';
                  } else if (errorMsg.includes('Failed to click') || errorMsg.includes('Failed to double click') || errorMsg.includes('Failed to right click')) {
                    detailedError += '\n\nSuggestion: The click action failed. Take a screenshot to see what happened, then try clicking again.';
                  } else if (errorMsg.includes('Failed to take screenshot')) {
                    detailedError += '\n\nSuggestion: Screenshot failed. The desktop might be loading. Wait a moment and try again.';
                  } else if (errorMsg.includes('Failed to press key')) {
                    detailedError += '\n\nSuggestion: Key press failed. Make sure the correct window is focused.';
                  } else if (errorMsg.includes('Failed to move mouse')) {
                    detailedError += '\n\nSuggestion: Mouse movement failed. Try again.';
                  } else if (errorMsg.includes('Failed to drag')) {
                    detailedError += '\n\nSuggestion: Drag operation failed. Try again with different coordinates.';
                  } else if (errorMsg.includes('Failed to scroll')) {
                    detailedError += '\n\nSuggestion: Scroll failed. Make sure a scrollable window is active.';
                  } else if (errorMsg.includes('Failed to execute bash')) {
                    detailedError += '\n\nSuggestion: Bash command failed. Check the command syntax and try again.';
                  }
                  
                  sendEvent({
                    type: "error",
                    errorText: errorMsg,
                  });
                  return {
                    tool_call_id: toolCall.id,
                    role: "tool",
                    content: detailedError,
                  };
                }
              })();

              // Dodaj wynik bezpośrednio do historii (tylko jeden tool call)
              // Jeśli narzędzie zwróciło obraz (screenshot), dodaj go jako wiadomość z obrazem
              if (toolResult!.image) {
                chatHistory.push({
                  role: "tool",
                  tool_call_id: toolResult!.tool_call_id,
                  content: toolResult!.content,
                });
                
                // Dodaj screenshot jako wiadomość użytkownika z obrazem dla AI
                // Szczegółowe dane techniczne o screenshocie
                const timestamp = new Date().toISOString();
                const width = resolution.x;
                const height = resolution.y;
                const centerX = Math.floor(width / 2);
                const centerY = Math.floor(height / 2);
                
                chatHistory.push({
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `SCREENSHOT DATA - Captured: ${timestamp}

Resolution: ${width} × ${height} pixels
Total Pixels: ${width * height} (${(width * height / 1000000).toFixed(2)} megapixels)
Aspect Ratio: ${(width / height).toFixed(4)}:1 (${width > height ? 'Landscape' : width < height ? 'Portrait' : 'Square'})
Diagonal: ${Math.round(Math.sqrt(width * width + height * height))} pixels
Format: PNG (24-bit RGB / 32-bit RGBA, 8 bits per channel)

Coordinate System:
- Origin: (0, 0) at TOP-LEFT corner
- X-axis: 0 to ${width - 1} (LEFT → RIGHT)
- Y-axis: 0 to ${height - 1} (TOP → BOTTOM, inverted)
- Center: (${centerX}, ${centerY})

Corner Coordinates:
- TOP-LEFT: (0, 0)
- TOP-RIGHT: (${width - 1}, 0)
- BOTTOM-LEFT: (0, ${height - 1})
- BOTTOM-RIGHT: (${width - 1}, ${height - 1})

Edge Midpoints:
- TOP: (${centerX}, 0)
- BOTTOM: (${centerX}, ${height - 1})
- LEFT: (0, ${centerY})
- RIGHT: (${width - 1}, ${centerY})

Note: All coordinates are integers. Y increases DOWNWARD.`,
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:image/png;base64,${toolResult!.image}`,
                      },
                    },
                  ],
                });
              } else {
                chatHistory.push(toolResult!);
              }
          } else {
            // AI finished without tool calls - add assistant message to history
            if (fullText) {
              chatHistory.push({
                role: "assistant",
                content: fullText,
              });
            }

            // Send finish event but continue the stream - AI decides when to stop
            sendEvent({
              type: "finish",
              content: fullText,
            });

            // NIE zamykamy streamu - AI kontynuuje pracę i samo decyduje kiedy kończy
            // Stream zostanie zamknięty tylko przez błąd lub ręczne zakończenie przez AI
          }
        }
      } catch (error) {
        console.error("Chat API error:", error);
        await killDesktop(sandboxId);
        sendEvent({
          type: "error",
          errorText: String(error),
        });
        isStreamClosed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-store, no-transform, must-revalidate, max-age=0, s-maxage=0, private",
      "Pragma": "no-cache",
      "Expires": "-1",
      "X-Accel-Buffering": "no",
      "Transfer-Encoding": "chunked",
      "Surrogate-Control": "no-store",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      "X-No-Chat-Cache": "true",
      "Clear-Site-Data": '"cache"',
    },
  });
}
