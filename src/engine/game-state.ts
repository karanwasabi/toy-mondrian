import {
  FIXED_TICK_MS,
  GRID_CELL_COUNT,
  GRID_HEIGHT,
  GRID_WIDTH,
  INITIAL_GRAVITY_MS,
  PIECE_BAG_ORDER,
} from './constants';
import { GamePhase, type GameState } from './types';

export function createInitialGameState(): GameState {
  return {
    boardSize: {
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
    },
    cells: new Uint8Array(GRID_CELL_COUNT),
    activePiece: null,
    score: 0,
    secondsElapsed: 0,
    gravityMs: INITIAL_GRAVITY_MS,
    dropCounterMs: 0,
    softDropActive: false,
    phase: GamePhase.Idle,
    pieceBag: {
      queue: [...PIECE_BAG_ORDER],
    },
    tick: 0,
  };
}

export { FIXED_TICK_MS };
export type { GameState };
