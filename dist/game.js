"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
// Figur Größen
const PIECE_SIZES = [2, 3, 4, 5];
const BOARD_SIZE = 10;
// Hilfsfunktionen zur zufälligen Generierung von Daten
function RandomIntInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
function RandomBool() {
    return Math.random() >= 0.5;
}
class Position {
    constructor(col, row) {
        this.col = col;
        this.row = row;
    }
    get DTO() {
        return {
            col: this.col,
            row: this.row
        };
    }
    Equal(other) {
        return this.row == other.row && this.col == other.col;
    }
    IsTouching(other) {
        let colDiff = Math.abs(this.col - other.col);
        let rowDiff = Math.abs(this.row - other.row);
        return (colDiff) <= 1 && (rowDiff <= 1);
    }
}
// Zur Dokumentation von Schüssen
class Shot {
    constructor(position, hit) {
        this.position = position;
        this.hit = hit;
    }
    get ShotDTO() {
        return {
            position: this.position,
            hit: this.hit,
        };
    }
}
class Piece {
    constructor(size, rotation, col, row) {
        this.size = size;
        this.rotation = rotation;
        this.piecePositions = [];
        this.hits = 0;
        for (let i = 0; i < size; i++) {
            if (rotation == 'E') {
                this.piecePositions.push(new Position(col + i, row));
            }
            else if (rotation == 'S') {
                this.piecePositions.push(new Position(col, row + i));
            }
        }
    }
    get PositionsDTO() {
        return this.piecePositions.map(pos => ({
            col: pos.col,
            row: pos.row,
        }));
    }
    get Position() {
        return this.piecePositions[0];
    }
    get Alive() {
        return this.hits < this.size;
    }
    CheckOverlap(position) {
        for (let piecePosition of this.piecePositions) {
            if (piecePosition.Equal(position)) {
                return true;
            }
        }
        return false;
    }
    // Returns true if position overlaps with piece
    CheckHit(attackPosition) {
        if (this.CheckOverlap(attackPosition)) {
            this.hits += 1;
            return true;
        }
        else {
            return false;
        }
    }
    // Returns true if piece is within 1 field of this piece
    IsPieceTouching(otherPiece) {
        for (let thisPos of this.piecePositions) {
            for (let otherPos of otherPiece.piecePositions) {
                if (thisPos.IsTouching(otherPos))
                    return true;
            }
        }
        return false;
    }
}
class Board {
    constructor(boardSize) {
        this.boardSize = boardSize;
        this.pieces = [];
        this.shots = [];
        this.piecesLeft = {
            2: 1, // 1 U-Boote
            3: 2, // 1 Zerstörer + 1 U-Boot
            4: 1, // 1 Kreuzer
            5: 1 // 1 Schlachtschiff
        };
        this.totalShotHP = 0;
        this.totalShotHP += this.piecesLeft[2] * 2;
        this.totalShotHP += this.piecesLeft[3] * 3;
        this.totalShotHP += this.piecesLeft[4] * 4;
        this.totalShotHP += this.piecesLeft[5] * 5;
    }
    get Alive() {
        const hits = this.shots.filter(shot => shot.hit).length;
        return hits < this.totalShotHP;
    }
    get BoardState() {
        return {
            size: this.boardSize,
            piecePositions: this.pieces.map(piece => piece.PositionsDTO).flat(),
            shots: this.shots.map(shot => shot.ShotDTO),
        };
    }
    addPiece(piece) {
        this.pieces.push(piece);
        this.piecesLeft[piece.size] -= 1;
    }
    IsPositionShip(position) {
        for (let piece of this.pieces) {
            if (piece.CheckOverlap(position))
                return true;
        }
        return false;
    }
    get TotalPiecesToPlaceLeft() {
        return this.piecesLeft[2] + this.piecesLeft[3] + this.piecesLeft[4] + this.piecesLeft[5];
    }
    isPositionInsideBoard(position) {
        return position.row >= 0 && position.row < this.boardSize && position.col >= 0 && position.col < this.boardSize;
    }
    // Should be called before TryPlacePiece
    IsPiecePlacementValid(newPiece) {
        // Check if Piece is inside Board
        for (let position of newPiece.piecePositions) {
            if (this.isPositionInsideBoard(position) == false)
                return false;
        }
        // Check if Piece is touching any other Piece
        for (let piece of this.pieces) {
            if (piece.IsPieceTouching(newPiece) == true) {
                return false;
            }
        }
        ;
        return true;
    }
    TryPlacePiece(newPiece) {
        // Check if Piece of this size can still be added
        if (this.piecesLeft[newPiece.size] < 1)
            return false;
        // Fail safe, should never happen
        if (!this.IsPiecePlacementValid(newPiece))
            return false;
        // Create new Piece and add to board and return true
        this.addPiece(newPiece);
        return true;
    }
    // Should be called before Shoot
    IsShotValid(newShotPosition) {
        // Is shot inside board?
        if (this.isPositionInsideBoard(newShotPosition) == false)
            return false;
        // Has shot already been fired?
        for (let shot of this.shots) {
            if (shot.position.Equal(newShotPosition))
                return false;
        }
        return true;
    }
    // returns if Shot hit a Piece on the Board
    Shoot(shotPosition) {
        // Fail safe, should never happen
        if (!this.IsShotValid(shotPosition))
            return false;
        let shotHit = false;
        // Check if any piece was hit
        for (let piece of this.pieces) {
            if (piece.CheckHit(shotPosition)) {
                shotHit = true;
                break;
            }
        }
        this.shots.push(new Shot(shotPosition, shotHit));
        return shotHit;
    }
}
class Game {
    constructor() {
        this.boardSize = BOARD_SIZE;
        this.winner = null;
        this.board1 = new Board(BOARD_SIZE);
        this.board2 = new Board(BOARD_SIZE);
    }
    get GameState() {
        return {
            player1board: this.board1.BoardState,
            player2board: this.board2.BoardState,
            winner: this.winner,
        };
    }
    getRandomPiece() {
        let size = PIECE_SIZES[RandomIntInRange(0, 3)];
        let rotation = RandomBool() ? 'E' : 'S';
        let col = RandomIntInRange(0, this.boardSize - 1);
        let row = RandomIntInRange(0, this.boardSize - 1);
        return new Piece(size, rotation, col, row);
    }
    PlacePieces(board) {
        while (board.TotalPiecesToPlaceLeft > 0) {
            // somehow get Piece Information from Player
            let piece = this.getRandomPiece();
            while (!board.IsPiecePlacementValid(piece)) {
                piece = this.getRandomPiece();
            }
            board.TryPlacePiece(piece);
        }
    }
    isShotValid(board, x, y) {
        return board.IsShotValid(new Position(x, y));
    }
    shoot(board, x, y) {
        return board.Shoot(new Position(x, y));
    }
    PlaceAllRandom() {
        this.PlacePieces(this.board1);
        this.PlacePieces(this.board2);
    }
    // Prüft ob Spiel noch läuft
    updateGameState(boardToCheck) {
        if (!boardToCheck.Alive) {
            this.winner = (boardToCheck == this.board2) ? 1 : 2;
        }
    }
    // Gibt True zurück, wenn Zug valide war, False falls nicht
    HandlePlayerTurn(positionX, positionY) {
        if (!this.isShotValid(this.board2, positionX, positionY)) {
            return false;
        }
        this.shoot(this.board2, positionX, positionY);
        this.updateGameState(this.board2);
        return true;
    }
    EnemyTurn() {
        let x = RandomIntInRange(0, this.boardSize);
        let y = RandomIntInRange(0, this.boardSize);
        while (!this.isShotValid(this.board1, x, y)) {
            x = RandomIntInRange(0, this.boardSize);
            y = RandomIntInRange(0, this.boardSize);
        }
        this.shoot(this.board1, x, y);
        this.updateGameState(this.board1);
        return true;
    }
}
exports.Game = Game;
