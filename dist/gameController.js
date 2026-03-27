"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeGameState = serializeGameState;
exports.createGame = createGame;
exports.getGame = getGame;
exports.playerTurn = playerTurn;
exports.deleteGame = deleteGame;
const game_1 = require("./game");
const uuid_1 = require("uuid");
const games = new Map();
function serializeGameState(game) {
    return JSON.stringify(game.GameState);
}
function createGame() {
    const id = (0, uuid_1.v4)();
    const game = new game_1.Game();
    game.PlaceAllRandom();
    games.set(id, game);
    return id;
}
function getGame(id) {
    return games.get(id);
}
// Returns if turn was valid
function playerTurn(game, positionX, positionY) {
    const result = game.HandlePlayerTurn(positionX, positionY);
    if (result) {
        game.EnemyTurn();
    }
    return result;
}
function deleteGame(id) {
    if (games.has(id)) {
        games.delete(id);
        return true;
    }
    else {
        return false;
    }
}
