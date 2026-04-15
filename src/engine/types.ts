export const CellColorId = {
  Empty: 0,
  Red: 1,
  Blue: 2,
  Yellow: 3,
  White: 4,
} as const;
export type CellColorId = (typeof CellColorId)[keyof typeof CellColorId];

export const PieceKind = {
  I: 'I',
  L: 'L',
  J: 'J',
  O: 'O',
  Z: 'Z',
  S: 'S',
  T: 'T',
} as const;
export type PieceKind = (typeof PieceKind)[keyof typeof PieceKind];

export const GamePhase = {
  Idle: 'idle',
  Running: 'running',
  GalleryClosed: 'galleryClosed',
} as const;
export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

export type MatrixSize = {
  width: number;
  height: number;
};

export type GridPosition = {
  x: number;
  y: number;
};

export type PieceCell = {
  x: number;
  y: number;
  color: CellColorId;
};

export type ActivePiece = {
  kind: PieceKind;
  rotation: 0 | 1 | 2 | 3;
  color: CellColorId;
  position: GridPosition;
  cells: PieceCell[];
};

export type InputCommand =
  | { type: 'StartGame' }
  | { type: 'MoveLeft' }
  | { type: 'MoveRight' }
  | { type: 'RotateCW' }
  | { type: 'SoftDropStep' }
  | { type: 'SoftDropStart' }
  | { type: 'SoftDropStop' }
  | { type: 'HardDrop' };

export type CommandSource = 'keyboard' | 'touch';

export type QueuedCommand = {
  command: InputCommand;
  tick: number;
  source: CommandSource;
  sequence: number;
};

export type PieceBagState = {
  queue: PieceKind[];
};

export type GameState = {
  boardSize: MatrixSize;
  cells: Uint8Array;
  activePiece: ActivePiece | null;
  score: number;
  secondsElapsed: number;
  gravityMs: number;
  dropCounterMs: number;
  softDropActive: boolean;
  phase: GamePhase;
  pieceBag: PieceBagState;
  tick: number;
};
