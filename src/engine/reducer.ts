import { willCollideAtOffset } from './collision';
import type { GameState, QueuedCommand, TickAction } from './types';

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
  if (!state.activePiece || state.lockPending) {
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
    return triggerLockPiece(state);
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
  // Lock/write-to-grid + line-clear is intentionally deferred to the next phase.
  return {
    ...state,
    tick: state.tick + 1,
    dropCounterMs: 0,
    lockPending: true,
  };
}
