import { CellColorId, PieceKind } from './types';

export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 20;
export const GRID_CELL_COUNT = GRID_WIDTH * GRID_HEIGHT;

export const INITIAL_GRAVITY_MS = 1000;
export const MIN_GRAVITY_MS = 80;
export const GRAVITY_ACCELERATION_PER_SECOND_MS = 6;

export const PASSIVE_SCORE_PER_SECOND = 5;
export const LINE_CLEAR_BASE_SCORE = 100;

export const TICK_RATE_HZ = 60;
export const FIXED_TICK_MS = 1000 / TICK_RATE_HZ;

export const SOFT_DROP_STEP_MS = 0;
export const SPAWN_Y = 0;

export const PIECE_BAG_ORDER: readonly PieceKind[] = [
  PieceKind.I,
  PieceKind.L,
  PieceKind.J,
  PieceKind.O,
  PieceKind.Z,
  PieceKind.S,
  PieceKind.T,
];

export const PIECE_COLOR_BY_KIND: Readonly<Record<PieceKind, CellColorId>> = {
  [PieceKind.I]: CellColorId.Red,
  [PieceKind.L]: CellColorId.Blue,
  [PieceKind.J]: CellColorId.Yellow,
  [PieceKind.O]: CellColorId.White,
  [PieceKind.Z]: CellColorId.Red,
  [PieceKind.S]: CellColorId.Blue,
  [PieceKind.T]: CellColorId.Yellow,
};

export const MONDRIAN_COLOR_HEX: Readonly<Record<CellColorId, string>> = {
  [CellColorId.Empty]: '#00000000',
  [CellColorId.Red]: '#E70503',
  [CellColorId.Blue]: '#0300AD',
  [CellColorId.Yellow]: '#FDDE06',
  [CellColorId.White]: '#FFFFFF',
};

export const PIECE_LOCAL_CELLS: Readonly<Record<PieceKind, readonly { x: number; y: number }[]>> = {
  [PieceKind.I]: [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
  ],
  [PieceKind.J]: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  [PieceKind.L]: [
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  [PieceKind.O]: [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  [PieceKind.S]: [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  [PieceKind.T]: [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  [PieceKind.Z]: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
};
