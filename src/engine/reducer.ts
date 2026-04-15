import { isValidPosition, willCollideAtOffset } from './collision';
import { LINE_CLEAR_BASE_SCORE, PIECE_LOCAL_CELLS, SPAWN_Y } from './constants';
import { processLineClears } from './line-clear';
import { getNextPiece } from './piece-bag';
import {
  GamePhase,
  type ActivePiece,
  type CellColorId,
  type GameState,
  type QueuedCommand,
  type TickAction,
} from './types';

export function reduce(state: GameState, action: QueuedCommand | TickAction): GameState {
  if (isTickAction(action)) {
    return applyTick(state, action);
  }

  switch (action.command.type) {
    case 'MoveLeft':
      return tryMoveHorizontal(state, -1);
    case 'MoveRight':
      return tryMoveHorizontal(state, 1);
    default:
      return state;
  }
}

function isTickAction(action: QueuedCommand | TickAction): action is TickAction {
  return 'type' in action && action.type === 'TickAction';
}

function tryMoveHorizontal(state: GameState, deltaX: number): GameState {
  if (!state.activePiece || state.lockPending) {
    return state;
  }

  if (willCollideAtOffset(state, state.activePiece, deltaX, 0)) {
    return state;
  }

  return {
    ...state,
    activePiece: {
      ...state.activePiece,
      position: {
        x: state.activePiece.position.x + deltaX,
        y: state.activePiece.position.y,
      },
    },
  };
}

function applyTick(state: GameState, action: TickAction): GameState {
  if (state.lockPending) {
    return resolveLockPending(state);
  }

  if (!state.activePiece) {
    return {
      ...state,
      tick: state.tick + 1,
    };
  }

  const nextDropCounter = state.dropCounterMs + action.deltaMs;
  if (nextDropCounter < state.gravityMs) {
    return {
      ...state,
      tick: state.tick + 1,
      dropCounterMs: nextDropCounter,
    };
  }

  if (willCollideAtOffset(state, state.activePiece, 0, 1)) {
    return resolveLockPending(triggerLockPiece(state));
  }

  return {
    ...state,
    tick: state.tick + 1,
    dropCounterMs: nextDropCounter - state.gravityMs,
    activePiece: {
      ...state.activePiece,
      position: {
        x: state.activePiece.position.x,
        y: state.activePiece.position.y + 1,
      },
    },
  };
}

function triggerLockPiece(state: GameState): GameState {
  return {
    ...state,
    tick: state.tick + 1,
    dropCounterMs: 0,
    lockPending: true,
  };
}

function resolveLockPending(state: GameState): GameState {
  if (!state.activePiece) {
    return {
      ...state,
      lockPending: false,
    };
  }

  const stampedGrid = stampActivePieceIntoGrid(state.cells, state.activePiece, state.boardSize.width);
  const { newGrid, linesCleared } = processLineClears(stampedGrid);
  const scoreGain = calculateLineClearScore(linesCleared);
  const nextScore = state.score + scoreGain;

  const { pieceKind, colorId, bagState, rngState } = getNextPiece(state.rngState, state.pieceBag);
  const nextActivePiece = createSpawnedPiece(pieceKind, colorId, state.boardSize.width);
  const isGameOver = !isValidPosition(
    { boardSize: state.boardSize, cells: newGrid },
    nextActivePiece,
    nextActivePiece.position.x,
    nextActivePiece.position.y
  );

  return {
    ...state,
    cells: newGrid,
    score: nextScore,
    pieceBag: bagState,
    rngState,
    activePiece: nextActivePiece,
    lockPending: false,
    phase: isGameOver ? GamePhase.GalleryClosed : state.phase,
  };
}

function stampActivePieceIntoGrid(grid: Uint8Array, piece: ActivePiece, boardWidth: number): Uint8Array {
  const nextGrid = new Uint8Array(grid);

  for (const cell of piece.cells) {
    const worldX = piece.position.x + cell.x;
    const worldY = piece.position.y + cell.y;
    const index = worldY * boardWidth + worldX;
    nextGrid[index] = cell.color;
  }

  return nextGrid;
}

function calculateLineClearScore(linesCleared: number): number {
  if (linesCleared <= 0) {
    return 0;
  }

  // Matches prototype combo sweep: 100 + 200 + 400 ... per additional row.
  return LINE_CLEAR_BASE_SCORE * (2 ** linesCleared - 1);
}

function createSpawnedPiece(kind: ActivePiece['kind'], colorId: CellColorId, boardWidth: number): ActivePiece {
  const localCells = PIECE_LOCAL_CELLS[kind];
  const pieceWidth = getPieceWidth(localCells);
  const spawnX = Math.floor((boardWidth - pieceWidth) / 2);

  return {
    kind,
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
