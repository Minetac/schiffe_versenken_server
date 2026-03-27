
export interface PositionDTO {
    col: number;
    row: number;
}

export interface ShotDTO {
    position: PositionDTO;
    hit: boolean;
}

export interface BoardDTO {
    size: number;
    piecePositions: PositionDTO[];
    shots: ShotDTO[];
}

export interface GameStateDTO {
    player1board: BoardDTO;
    player2board: BoardDTO;
    winner: 1 | 2 | null;
}