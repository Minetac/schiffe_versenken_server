"use strict";
const statusEl = document.getElementById("status");
const board1El = document.getElementById("board1");
const board2El = document.getElementById("board2");
const newGameBtn = document.getElementById("newGameBtn");
const loadGameBtn = document.getElementById("loadGameBtn");
const gameIdInput = document.getElementById("gameIdInput");
const recordBtn = document.getElementById("recordBtn");
const voiceOutput = document.getElementById("voiceOutput");
let currentGameId = null;
let lastState = null;
// Spracherkennung initialisieren
const SpeechRecognition = window.SpeechRecognition ||
    window.webkitSpeechRecognition;
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
});
// Bei Ergebnis wird an prüfende Funtkion übergeben
recognition.onresult = (event) => {
    const results = event.results;
    const transcript = results[0][0].transcript.trim();
    console.log("Erkannt:", transcript);
    handleSpeechInput(transcript);
};
recognition.onerror = (event) => {
    console.error("Fehler:", event.error);
};
function handleSpeechInput(input) {
    // Leerzeichen entfernen und großschreiben
    const cleanInput = input.replace(/\s+/g, "").toUpperCase();
    // RegEx Pattern zur Erkennung
    const pattern = /^[A-J]([1-9]|10)$/;
    console.log("Cleaner Input:", cleanInput);
    if (pattern.test(cleanInput)) {
        voiceOutput.textContent = `Gültige Eingabe: ${cleanInput}`;
        processValidInput(cleanInput);
    }
    else {
        voiceOutput.textContent = `Ungültige Eingabe: ${input}`;
    }
}
function processValidInput(input) {
    const letter = input.charCodeAt(0) - 65;
    const number = parseInt(input.slice(1, 3)) - 1;
    console.log("Erkannter Buchstabe:", letter);
    console.log("Erkannte Zahl:", number);
    sendMove(letter, number);
}
function setStatus(text) {
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
async function loadGame(id) {
    const gameId = id ?? gameIdInput.value.trim();
    if (!gameId) {
        setStatus("Keine Game ID");
        return;
    }
    setStatus("Lade Spiel...");
    const res = await fetch(`/game/${encodeURIComponent(gameId)}`);
    if (!res.ok) {
        setStatus("Spiel nicht gefunden");
        return;
    }
    const text = await res.text();
    // Server sendet JSON stringified GameState in serializeGameState
    const state = JSON.parse(text);
    currentGameId = gameId;
    lastState = state;
    renderState(state);
    recordBtn.hidden = false;
    setStatus("Spiel geladen");
}
function buildGrid(boardEl, size) {
    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = `repeat(${size}, 28px)`;
    boardEl.style.gridTemplateRows = `repeat(${size}, 28px)`;
}
function posToKey(p) { return `${p.col}:${p.row}`; }
function renderBoard(boardEl, board, isOwnBoard) {
    const size = board.size;
    buildGrid(boardEl, size);
    // map positions for quick lookup
    const shipSet = new Set(board.piecePositions.map(posToKey));
    const shotMap = new Map(board.shots.map(s => [posToKey(s.position), s.hit]));
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            const key = `${col}:${row}`;
            // Own board: show ships
            if (isOwnBoard && shipSet.has(key)) {
                cell.classList.add("ship");
            }
            else {
                cell.classList.add("unknown");
            }
            // Shots: override visuals
            if (shotMap.has(key)) {
                const hit = shotMap.get(key);
                if (hit) {
                    cell.className = "cell hit";
                }
                else {
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
async function sendMove(x, y) {
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
    const newState = JSON.parse(text);
    lastState = newState;
    renderState(newState);
    setStatus(`Schuss auf ${x}, ${y}`);
    if (newState.winner) {
        setStatus(`Spiel beendet, Gewinner: Player ${newState.winner}`);
    }
}
function renderState(state) {
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
    if (id)
        loadGame(id);
});
