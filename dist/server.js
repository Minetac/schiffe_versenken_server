"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const gameController_1 = require("./gameController");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.use("/dist", express_1.default.static(path_1.default.join(__dirname, "../dist")));
app.use("/", express_1.default.static(path_1.default.join(__dirname, "../static")));
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "/static/index.html"));
});
// Implementierung HTTP-Standardmethode POST
// Nutzung zur Erstellung eines neuen Spiels
app.post("/game", (req, res) => {
    const id = (0, gameController_1.createGame)();
    res.status(201).json({ gameId: id });
});
function GetStringFromParamId(id) {
    return (Array.isArray(id)) ? id[0] : id;
}
app.get("/game/:id", (req, res) => {
    const id = GetStringFromParamId(req.params.id);
    const game = (0, gameController_1.getGame)(id);
    if (!game)
        return res.status(404).send("Spiel nicht gefunden");
    const gameState = (0, gameController_1.serializeGameState)(game);
    res.send(gameState);
});
app.post("/game/:id/shoot", (req, res) => {
    const id = GetStringFromParamId(req.params.id);
    const game = (0, gameController_1.getGame)(id);
    if (!game)
        return res.status(404).send("Spiel nicht gefunden");
    const { x, y } = req.body;
    // Handle Result?
    const result = (0, gameController_1.playerTurn)(game, x, y);
    if (!result) {
        return res.status(400).json({
            error: "invalid_shot",
            message: "Shot out of bounds or already fired"
        });
    }
    const gameState = (0, gameController_1.serializeGameState)(game);
    res.send(gameState);
});
app.delete("/game/:id", (req, res) => {
    const id = GetStringFromParamId(req.params.id);
    const result = (0, gameController_1.deleteGame)(id);
    if (!result) {
        return res.status(400).json({
            error: "game_not_found",
            message: "Game konnte nicht gelöscht werden, da es nicht existiert"
        });
    }
    res.json({ id: id });
});
app.listen(port, () => {
    console.log("Server running on port", port);
});
