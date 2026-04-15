export type MatrixSize = {
  width: number;
  height: number;
};

export type GameState = {
  boardSize: MatrixSize;
  tick: number;
};

export function createInitialGameState(): GameState {
  return {
    boardSize: {
      width: 10,
      height: 20,
    },
    tick: 0,
  };
}
