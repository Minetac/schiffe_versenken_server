import { Game } from "./game";
import { v4 as uuid } from "uuid";

const games = new Map<string, Game>();

export function serializeGameState(game: Game): string {
    return JSON.stringify(game.GameState)
}

export function createGame(): string {
    const id = uuid();
    const game = new Game();
    game.PlaceAllRandom();
    games.set(id, game);
    return id;
}

export function getGame(id: string): Game | undefined {
    return games.get(id);
}

// Returns if turn was valid
export function playerTurn(game: Game, positionX: number, positionY: number): boolean {
    const result = game.HandlePlayerTurn(positionX, positionY);
    
    if (result) {
        game.EnemyTurn();
    }

    return result;
}

export function deleteGame(id: string): boolean {
    if (games.has(id)) {
        games.delete(id);
        return true;
    } else {
        return false;
    }
}

