import { MONDRIAN_COLOR_HEX, PIECE_BAG_ORDER, PIECE_COLOR_BY_KIND } from './constants';
import { nextInt } from './random';
import { CellColorId, type PieceKind, type RngState } from './types';

const MONDRIAN_SPAWN_COLORS: readonly CellColorId[] = [
  CellColorId.Red,
  CellColorId.Blue,
  CellColorId.Yellow,
  CellColorId.White,
];

export function getPieceColorId(pieceKind: PieceKind): CellColorId {
  return PIECE_COLOR_BY_KIND[pieceKind];
}

export function getPieceKindsForColorId(colorId: CellColorId): PieceKind[] {
  if (colorId === CellColorId.Empty) {
    return [];
  }

  return PIECE_BAG_ORDER.filter((pieceKind) => PIECE_COLOR_BY_KIND[pieceKind] === colorId);
}

export function getRandomMondrianColorId(rngState: RngState): { colorId: CellColorId; rngState: RngState } {
  const { value: index, rngState: nextState } = nextInt(rngState, MONDRIAN_SPAWN_COLORS.length);
  return {
    colorId: MONDRIAN_SPAWN_COLORS[index],
    rngState: nextState,
  };
}

export function getColorHex(colorId: CellColorId): string {
  return MONDRIAN_COLOR_HEX[colorId];
}
