import express, { Request, Response } from 'express';
import { createGame, getGame, playerTurn, serializeGameState, deleteGame } from "./gameController";
import path from "path";

const app = express();
const port = 3000;
app.use(express.json());
app.use("/dist", express.static(path.join(__dirname, "../dist")));
app.use("/", express.static(path.join(__dirname, "../static")))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/index.html"));
});

// Implementierung HTTP-Standardmethode POST
// Nutzung zur Erstellung eines neuen Spiels
app.post("/game", (req: Request, res: Response) => {
    const id = createGame();

    res.status(201).json({ gameId: id });
});

function GetStringFromParamId(id: string | string[]): string {
    return (Array.isArray(id)) ? id[0] : id;
}

app.get("/game/:id", (req: Request, res: Response) => {
    const id: string = GetStringFromParamId(req.params.id);
    const game = getGame(id);
    if (!game) return res.status(404).send("Spiel nicht gefunden");
    
    const gameState: string = serializeGameState(game);
    res.send(gameState)
})

app.post("/game/:id/shoot", (req: Request, res: Response) => {
    const id: string = GetStringFromParamId(req.params.id);
    const game = getGame(id);
    if (!game) return res.status(404).send("Spiel nicht gefunden");
    
    const { x, y } = req.body;
    
    // Handle Result?
    const result = playerTurn(game, x, y);
    if (!result) {
        return res.status(400).json({
            error: "invalid_shot", 
            message: "Shot out of bounds or already fired"
        });
    }

    const gameState: string = serializeGameState(game);

    res.send(gameState);
});

app.delete("/game/:id", (req: Request, res: Response) => {
    const id: string = GetStringFromParamId(req.params.id);
    const result = deleteGame(id);

    if (!result) {
        return res.status(400).json({
            error: "game_not_found", 
            message: "Game konnte nicht gelöscht werden, da es nicht existiert"
        })
    }

    res.json({id: id})
});

app.listen(port, () => {
    console.log("Server running on port", port);
});

