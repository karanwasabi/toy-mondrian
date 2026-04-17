import {
  FIXED_TICK_MS,
  GRID_CELL_COUNT,
  GRID_HEIGHT,
  GRID_WIDTH,
  INITIAL_GRAVITY_MS,
  PIECE_LOCAL_CELLS,
  SPAWN_Y,
} from './constants';
import { createEmptyPieceBagState, getNextPiece } from './piece-bag';
import { createRng } from './random';
import { GamePhase, type GameState } from './types';

export function createInitialGameState(seed: number): GameState {
  const initialRngState = createRng(seed);
  const emptyPieceBag = createEmptyPieceBagState();
  const { pieceKind, colorId, bagState, rngState } = getNextPiece(initialRngState, emptyPieceBag);
  const localCells = PIECE_LOCAL_CELLS[pieceKind];
  const pieceWidth = getPieceWidth(localCells);
  const spawnX = Math.floor((GRID_WIDTH - pieceWidth) / 2);

  return {
    boardSize: {
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
    },
    cells: new Uint8Array(GRID_CELL_COUNT),
    activePiece: {
      kind: pieceKind,
      rotation: 0,
      color: colorId,
      position: {
        x: spawnX,
        y: SPAWN_Y,
      },
      cells: localCells.map((cell) => ({
        x: cell.x,
        y: cell.y,
        color: colorId,
      })),
    },
    score: 0,
    blocksUsed: 0,
    elapsedMs: 0,
    secondsElapsed: 0,
    gravityMs: INITIAL_GRAVITY_MS,
    dropCounterMs: 0,
    softDropActive: false,
    lockPending: false,
    phase: GamePhase.Idle,
    pieceBag: bagState,
    rngState,
    tick: 0,
  };
}

function getPieceWidth(cells: readonly { x: number; y: number }[]): number {
  let maxX = 0;
  for (const cell of cells) {
    if (cell.x > maxX) {
      maxX = cell.x;
    }
  }
  return maxX + 1;
}

export { FIXED_TICK_MS };
export type { GameState };
