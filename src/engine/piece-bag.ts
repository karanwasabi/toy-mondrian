import { PIECE_BAG_ORDER } from './constants';
import { getRandomMondrianColorId } from './palette';
import { nextInt, type RngState } from './random';
import type { CellColorId, PieceBagState, PieceKind } from './types';

export type NextPieceResult = {
  pieceKind: PieceKind;
  colorId: CellColorId;
  bagState: PieceBagState;
  rngState: RngState;
};

export function createEmptyPieceBagState(): PieceBagState {
  return { queue: [] };
}

export function getNextPiece(rngState: RngState, bagState: PieceBagState): NextPieceResult {
  const { nextPieceKind, remainingBagState, rngState: rngAfterBag } = drawNextPieceKind(rngState, bagState);
  const { colorId, rngState: rngAfterColor } = getRandomMondrianColorId(rngAfterBag);

  return {
    pieceKind: nextPieceKind,
    colorId,
    bagState: remainingBagState,
    rngState: rngAfterColor,
  };
}

function drawNextPieceKind(
  rngState: RngState,
  bagState: PieceBagState
): {
  nextPieceKind: PieceKind;
  remainingBagState: PieceBagState;
  rngState: RngState;
} {
  const sourceQueue = bagState.queue.length > 0 ? [...bagState.queue] : [...PIECE_BAG_ORDER];
  const { shuffled, rngState: rngAfterShuffle } =
    bagState.queue.length > 0 ? { shuffled: sourceQueue, rngState } : shuffleBag(sourceQueue, rngState);

  const [nextPieceKind, ...remainingQueue] = shuffled;
  if (!nextPieceKind) {
    throw new Error('Cannot draw piece from an empty bag');
  }

  return {
    nextPieceKind,
    remainingBagState: { queue: remainingQueue },
    rngState: rngAfterShuffle,
  };
}

function shuffleBag(
  bag: PieceKind[],
  rngState: RngState
): {
  shuffled: PieceKind[];
  rngState: RngState;
} {
  const shuffled = [...bag];
  let nextRngState = rngState;

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const { value: j, rngState: updatedRngState } = nextInt(nextRngState, i + 1);
    nextRngState = updatedRngState;

    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  return {
    shuffled,
    rngState: nextRngState,
  };
}
