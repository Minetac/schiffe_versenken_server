type PositionDTO = { col: number; row: number };
type ShotDTO = { position: PositionDTO; hit: boolean };
type BoardDTO = { size: number; piecePositions: PositionDTO[]; shots: ShotDTO[] };
type GameStateDTO = { player1board: BoardDTO; player2board: BoardDTO; winner: 1 | 2 | null };

const statusEl = document.getElementById("status") as HTMLElement;
const board1El = document.getElementById("board1") as HTMLElement;
const board2El = document.getElementById("board2") as HTMLElement;
const newGameBtn = document.getElementById("newGameBtn") as HTMLButtonElement;
const loadGameBtn = document.getElementById("loadGameBtn") as HTMLButtonElement;
const gameIdInput = document.getElementById("gameIdInput") as HTMLInputElement;
const recordBtn = document.getElementById("recordBtn") as HTMLButtonElement;
const voiceOutput = document.getElementById("voiceOutput") as HTMLParagraphElement

let currentGameId: string | null = null;
let lastState: GameStateDTO | null = null;

// Spracherkennung initialisieren
const SpeechRecognition = 
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Spracherkennung wird von diesem Browser nicht unterstüt.");
} 

// Spracheinstellung erstmals nur auf Deutsch konfigurieren
const recognition = new SpeechRecognition();
recognition.lang = "de-DE";
recognition.continuous = false;
recognition.interimResults = false;

// Mit Button verbinden
recordBtn.addEventListener("click", () => {
    if (recognition)
    recognition.start();
})

// Bei Ergebnis wird an prüfende Funtkion übergeben
recognition.onresult = (event: Event) => {
    const results = (event as any).results;
    const transcript = results[0][0].transcript.trim();
    console.log("Rohe Daten Erkannt:", transcript);
    handleSpeechInput(transcript);
};

recognition.onerror = (event: any) => {
    console.error("Fehler:", event.error);
};

function handleSpeechInput(input: string) {
    // Leerzeichen entfernen und großschreiben
    const cleanInput = input.replace(/\s+/g, "").toUpperCase();

    // RegEx Pattern zur Erkennung
    const pattern = /^[A-J]([1-9]|10)$/;
    if (pattern.test(cleanInput)) {
        voiceOutput.textContent = `Gültige Eingabe: ${cleanInput}`;
        processValidInput(cleanInput);
    } else {
        voiceOutput.textContent = `Ungültige Eingabe: ${input}`;
    }
}

function processValidInput(input: string) {
    const letter = input.charCodeAt(0) - 65;
    const number = parseInt(input.slice(1, 3)) - 1;

    console.log("Erkannter Buchstabe Index:", letter);
    console.log("Erkannte Zahl Index:", number);

    sendMove(letter, number)
}

function setStatus(text: string) { 
    statusEl.textContent = text; 
}

async function createGame() {
    if (currentGameId != null) {
        const res = await fetch(`/game/${encodeURIComponent(currentGameId)}`, { method: "DELETE" });
        if (!res.ok) {
            console.log("Fehler beim löschen der alten Spielinstanz");
            return;
        }
    }
    
    setStatus("Erstelle Spiel...");
    const res = await fetch("/game", { method: "POST", headers: { "Content-Type": "application/json" } });
    if (!res.ok) { 
        setStatus("Fehler beim Erstellen"); 
        return; 
    }
    
    const data = await res.json();
    currentGameId = data.gameId;
    
    if (currentGameId != null && gameIdInput instanceof HTMLInputElement) {
        gameIdInput.value = currentGameId;
        setStatus("Spiel erstellt: " + currentGameId);
        await loadGame(currentGameId);
    }
}

async function loadGame(id?: string) {
    const gameId = id ?? gameIdInput.value.trim();
    if (!gameId) { setStatus("Keine Game ID"); return; }
    setStatus("Lade Spiel...");
    const res = await fetch(`/game/${encodeURIComponent(gameId)}`);
    if (!res.ok) { setStatus("Spiel nicht gefunden"); return; }
    const text = await res.text();

    // Server sendet JSON stringified GameState in serializeGameState
    const state: GameStateDTO = JSON.parse(text);
    currentGameId = gameId;
    lastState = state;
    renderState(state);
    recordBtn.hidden = false;
    setStatus("Spiel geladen");
}

function buildGrid(boardEl: HTMLElement, size: number) {
    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = `repeat(${size}, 28px)`;
    boardEl.style.gridTemplateRows = `repeat(${size}, 28px)`;
}

function posToKey(p: PositionDTO) { return `${p.col}:${p.row}` }

function renderBoard(boardEl: HTMLElement, board: BoardDTO, isOwnBoard: boolean) {
    const size = board.size;
    buildGrid(boardEl, size);
    
    // map positions for quick lookup
    const shipSet = new Set(board.piecePositions.map(posToKey));
    const shotMap = new Map(board.shots.map(s => [posToKey(s.position), s.hit] as [string, boolean]));
    
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            const key = `${col}:${row}`;
            
            // Own board: show ships
            if (isOwnBoard && shipSet.has(key)) {
                cell.classList.add("ship");
            } else {
                cell.classList.add("unknown");
            }
            
            // Shots: override visuals
            if (shotMap.has(key)) {
                const hit = shotMap.get(key);
                if (hit) {
                    cell.className = "cell hit";
                } else {
                    cell.className = "cell miss";
                }
            }
            
            // data attributes for debugging
            cell.setAttribute("data-col", String(col));
            cell.setAttribute("data-row", String(row));
            boardEl.appendChild(cell);
        }
    }
}

async function sendMove(x: number, y: number) {
    if (!currentGameId) {
        setStatus("Kein Spiel geladen");
        return;
    }

    if (lastState != null && lastState.winner != null) {
        setStatus("Das Spiel ist vorbei, starte ein neues Spiel.");
        return;
    }

    const res = await fetch(`/game/${encodeURIComponent(currentGameId)}/shoot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x, y })
    });

    console.log(res.ok);
    if (!res.ok) {
        setStatus("Schuss ungültig oder Fehler");
        return;
    }

    const text = await res.text();
    const newState: GameStateDTO = JSON.parse(text);
    lastState = newState;
    renderState(newState);
    setStatus(`Schuss auf ${x}, ${y}`);

    if (newState.winner) {
        setStatus(`Spiel beendet, Gewinner: Player ${newState.winner}`)
    }
}

function renderState(state: GameStateDTO) {
    renderBoard(board1El, state.player1board, true);
    renderBoard(board2El, state.player2board, false);
}

// Event handlers
newGameBtn.addEventListener("click", () => createGame());
loadGameBtn.addEventListener("click", () => loadGame());


// Nötig?
// Auto-load if gameId present in input on start
window.addEventListener("load", () => {
    const id = gameIdInput.value.trim();
    if (id) loadGame(id);
});
