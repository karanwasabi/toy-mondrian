import type { InputCommand } from '../engine/types';

type Dispatch = (cmd: InputCommand) => void;
type CanDispatch = () => boolean;

const TAP_MAX_DURATION_MS = 180;
const TAP_MAX_MOVE_PX = 12;
const SWIPE_STEP_PX = 40;

type TouchState = {
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startTime: number;
  movedDistance: number;
};

export function setupTouch(dispatch: Dispatch, canDispatch: CanDispatch = () => true): () => void {
  let activeTouchId: number | null = null;
  let touchState: TouchState | null = null;

  const onTouchStart = (event: TouchEvent): void => {
    if (!canDispatch()) {
      return;
    }

    if (activeTouchId !== null || event.changedTouches.length === 0) {
      return;
    }

    const touch = event.changedTouches[0];
    activeTouchId = touch.identifier;
    touchState = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      startTime: performance.now(),
      movedDistance: 0,
    };

    event.preventDefault();
  };

  const onTouchMove = (event: TouchEvent): void => {
    if (!canDispatch()) {
      activeTouchId = null;
      touchState = null;
      return;
    }

    if (activeTouchId === null || !touchState) {
      return;
    }

    const touch = findTouchById(event.changedTouches, activeTouchId);
    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - touchState.lastX;
    const deltaY = touch.clientY - touchState.lastY;
    touchState.movedDistance += Math.abs(deltaX) + Math.abs(deltaY);

    let remainingX = touch.clientX - touchState.startX;
    while (remainingX >= SWIPE_STEP_PX) {
      dispatch({ type: 'MoveRight' });
      touchState.startX += SWIPE_STEP_PX;
      remainingX -= SWIPE_STEP_PX;
    }
    while (remainingX <= -SWIPE_STEP_PX) {
      dispatch({ type: 'MoveLeft' });
      touchState.startX -= SWIPE_STEP_PX;
      remainingX += SWIPE_STEP_PX;
    }

    let remainingY = touch.clientY - touchState.startY;
    while (remainingY >= SWIPE_STEP_PX) {
      dispatch({ type: 'SoftDropStep' });
      touchState.startY += SWIPE_STEP_PX;
      remainingY -= SWIPE_STEP_PX;
    }

    touchState.lastX = touch.clientX;
    touchState.lastY = touch.clientY;
    event.preventDefault();
  };

  const onTouchEnd = (event: TouchEvent): void => {
    if (!canDispatch()) {
      activeTouchId = null;
      touchState = null;
      return;
    }

    if (activeTouchId === null || !touchState) {
      return;
    }

    const touch = findTouchById(event.changedTouches, activeTouchId);
    if (!touch) {
      return;
    }

    const elapsedMs = Math.max(1, performance.now() - touchState.startTime);
    const totalDx = touch.clientX - touchState.startX;
    const totalDy = touch.clientY - touchState.startY;
    const distance = Math.hypot(totalDx, totalDy);

    const isTap = elapsedMs <= TAP_MAX_DURATION_MS && distance <= TAP_MAX_MOVE_PX;

    if (isTap) {
      dispatch({ type: 'RotateCW' });
    }

    activeTouchId = null;
    touchState = null;
    event.preventDefault();
  };

  const onTouchCancel = (): void => {
    activeTouchId = null;
    touchState = null;
  };

  document.body.addEventListener('touchstart', onTouchStart, { passive: false });
  document.body.addEventListener('touchmove', onTouchMove, { passive: false });
  document.body.addEventListener('touchend', onTouchEnd, { passive: false });
  document.body.addEventListener('touchcancel', onTouchCancel, { passive: false });

  return () => {
    document.body.removeEventListener('touchstart', onTouchStart);
    document.body.removeEventListener('touchmove', onTouchMove);
    document.body.removeEventListener('touchend', onTouchEnd);
    document.body.removeEventListener('touchcancel', onTouchCancel);
  };
}

function findTouchById(touchList: TouchList, identifier: number): Touch | null {
  for (let i = 0; i < touchList.length; i += 1) {
    const touch = touchList.item(i);
    if (!touch) {
      continue;
    }
    if (touch.identifier === identifier) {
      return touch;
    }
  }
  return null;
}
