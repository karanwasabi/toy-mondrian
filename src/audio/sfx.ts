import { GamePhase, type GameState } from '../engine/types';
import lineUrl from '../assets/sounds/line.wav';
import moveUrl from '../assets/sounds/move.wav';
import rotateUrl from '../assets/sounds/rotate.wav';
import victoryUrl from '../assets/sounds/victory.wav';

type SfxId = 'move' | 'rotate' | 'line' | 'victory';

type SfxController = {
  installUnlockHandlers: () => void;
  playMove: () => void;
  playRotate: () => void;
  playLine: () => void;
  playVictory: () => void;
};

const MOVE_MIN_INTERVAL_MS = 60;
const LINE_CLEAR_MIN_SCORE_GAIN = 100;

export function createSfxController(): SfxController {
  const sounds: Record<SfxId, HTMLAudioElement> = {
    move: new Audio(moveUrl),
    rotate: new Audio(rotateUrl),
    line: new Audio(lineUrl),
    victory: new Audio(victoryUrl),
  };

  for (const audio of Object.values(sounds)) {
    audio.preload = 'auto';
  }

  let unlocked = false;
  let lastMoveAt = 0;

  const removeUnlockHandlers = (): void => {
    window.removeEventListener('pointerdown', tryUnlock, true);
    window.removeEventListener('keydown', tryUnlock, true);
    window.removeEventListener('touchstart', tryUnlock, true);
  };

  const tryUnlock = (): void => {
    if (unlocked) {
      return;
    }
    unlocked = true;
    removeUnlockHandlers();
  };

  const play = (id: SfxId): void => {
    if (!unlocked) {
      return;
    }
    const audio = sounds[id];
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Ignore transient browser playback failures.
    });
  };

  return {
    installUnlockHandlers: () => {
      // Capture phase ensures unlock runs before document/body input handlers.
      window.addEventListener('pointerdown', tryUnlock, { capture: true, passive: true });
      window.addEventListener('keydown', tryUnlock, { capture: true, passive: true });
      window.addEventListener('touchstart', tryUnlock, { capture: true, passive: true });
    },
    playMove: () => {
      const now = performance.now();
      if (now - lastMoveAt < MOVE_MIN_INTERVAL_MS) {
        return;
      }
      lastMoveAt = now;
      play('move');
    },
    playRotate: () => {
      play('rotate');
    },
    playLine: () => {
      play('line');
    },
    playVictory: () => {
      play('victory');
    },
  };
}

export function applySfxForTransition(previous: GameState, current: GameState, sfx: SfxController): void {
  const softDropJustStarted = !previous.softDropActive && current.softDropActive;
  if (softDropJustStarted) {
    sfx.playMove();
  }

  const phaseJustClosed = previous.phase !== GamePhase.GalleryClosed && current.phase === GamePhase.GalleryClosed;
  if (phaseJustClosed) {
    sfx.playVictory();
    return;
  }

  const pieceLocked = current.blocksUsed > previous.blocksUsed;
  const newPieceWhileSoftDropping =
    pieceLocked && current.softDropActive && current.phase !== GamePhase.GalleryClosed && current.activePiece !== null;
  if (newPieceWhileSoftDropping) {
    sfx.playMove();
  }

  const scoreGained = current.score - previous.score;
  if (pieceLocked && scoreGained >= LINE_CLEAR_MIN_SCORE_GAIN) {
    sfx.playLine();
  }

  if (pieceLocked || !previous.activePiece || !current.activePiece) {
    return;
  }
  const previousPiece = previous.activePiece;
  const currentPiece = current.activePiece;

  const rotated = currentPiece.rotation !== previousPiece.rotation;
  if (rotated) {
    sfx.playRotate();
    return;
  }

  const movedHorizontally = currentPiece.position.x !== previousPiece.position.x;
  if (movedHorizontally) {
    sfx.playMove();
  }
}
