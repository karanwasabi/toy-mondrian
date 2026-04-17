import { MONDRIAN_COLOR_HEX } from '../engine/constants';
import { CellColorId, type GameState } from '../engine/types';

type Rgba = readonly [number, number, number, number];
type CellState = { color: number };

function hexToRgba(hex: string): Rgba {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  return [r, g, b, 255];
}

function buildPalette(): Readonly<Record<number, Rgba>> {
  return {
    [CellColorId.Empty]: [0, 0, 0, 0],
    [CellColorId.Red]: hexToRgba(MONDRIAN_COLOR_HEX[CellColorId.Red]),
    [CellColorId.Blue]: hexToRgba(MONDRIAN_COLOR_HEX[CellColorId.Blue]),
    [CellColorId.Yellow]: hexToRgba(MONDRIAN_COLOR_HEX[CellColorId.Yellow]),
    [CellColorId.White]: hexToRgba(MONDRIAN_COLOR_HEX[CellColorId.White]),
  };
}

const PALETTE_RGBA = buildPalette();
const BOARD_BG_RGBA: Rgba = [255, 255, 255, 255];
const BORDER_RGBA: Rgba = [17, 17, 17, 255];

/**
 * Renders the board (including active piece) into an RGBA buffer.
 * Layout matches `GridTextureBridge`: texture size is boardW * cellPixels by boardH * cellPixels.
 */
export function composeBoardRgbaInto(
  state: GameState,
  cellPixels: number,
  borderPixels: number,
  target: Uint8Array | Uint8ClampedArray,
  textureWidth: number,
  textureHeight: number
): void {
  const boardWidth = state.boardSize.width;
  const boardHeight = state.boardSize.height;

  const writePixel = (x: number, y: number, r: number, g: number, b: number, a: number): void => {
    const offset = (y * textureWidth + x) * 4;
    target[offset] = r;
    target[offset + 1] = g;
    target[offset + 2] = b;
    target[offset + 3] = a;
  };

  const fillRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    r: number,
    g: number,
    b: number,
    a: number
  ): void => {
    for (let py = 0; py < height; py += 1) {
      for (let px = 0; px < width; px += 1) {
        writePixel(x + px, y + py, r, g, b, a);
      }
    }
  };

  const [bgR, bgG, bgB, bgA] = BOARD_BG_RGBA;
  for (let i = 0; i < target.length; i += 4) {
    target[i] = bgR;
    target[i + 1] = bgG;
    target[i + 2] = bgB;
    target[i + 3] = bgA;
  }

  const cells: CellState[] = Array.from({ length: boardWidth * boardHeight }, (_, index) => ({
    color: state.cells[index] ?? CellColorId.Empty,
  }));

  const activePiece = state.activePiece;
  if (activePiece) {
    for (const cell of activePiece.cells) {
      const worldX = activePiece.position.x + cell.x;
      const worldY = activePiece.position.y + cell.y;
      if (worldX < 0 || worldX >= boardWidth || worldY < 0 || worldY >= boardHeight) {
        continue;
      }
      cells[worldY * boardWidth + worldX].color = cell.color;
    }
  }

  const getCellColor = (x: number, y: number): number => {
    if (x < 0 || x >= boardWidth || y < 0 || y >= boardHeight) {
      return CellColorId.Empty;
    }
    return cells[y * boardWidth + x].color;
  };

  const hasBoundary = (a: number, b: number): boolean => {
    return a !== b && !(a === CellColorId.Empty && b === CellColorId.Empty);
  };

  const seamCoordX = (x: number): number => {
    return x === boardWidth ? textureWidth - borderPixels : x * cellPixels;
  };

  const seamCoordY = (y: number): number => {
    return y === boardHeight ? textureHeight - borderPixels : y * cellPixels;
  };

  for (let y = 0; y < boardHeight; y += 1) {
    for (let x = 0; x < boardWidth; x += 1) {
      const color = cells[y * boardWidth + x].color;
      if (color === CellColorId.Empty) {
        continue;
      }
      const [fillR, fillG, fillB, fillA] = PALETTE_RGBA[color] ?? PALETTE_RGBA[CellColorId.Empty];
      fillRect(x * cellPixels, y * cellPixels, cellPixels, cellPixels, fillR, fillG, fillB, fillA);
    }
  }

  const [borderR, borderG, borderB, borderA] = BORDER_RGBA;

  for (let y = 0; y < boardHeight; y += 1) {
    for (let x = 0; x <= boardWidth; x += 1) {
      const left = getCellColor(x - 1, y);
      const right = getCellColor(x, y);
      if (!hasBoundary(left, right)) {
        continue;
      }
      const seamX = seamCoordX(x);
      fillRect(seamX, y * cellPixels, borderPixels, cellPixels, borderR, borderG, borderB, borderA);
    }
  }

  for (let y = 0; y <= boardHeight; y += 1) {
    for (let x = 0; x < boardWidth; x += 1) {
      const top = getCellColor(x, y - 1);
      const bottom = getCellColor(x, y);
      if (!hasBoundary(top, bottom)) {
        continue;
      }
      const seamY = seamCoordY(y);
      fillRect(x * cellPixels, seamY, cellPixels, borderPixels, borderR, borderG, borderB, borderA);
    }
  }

  for (let y = 0; y <= boardHeight; y += 1) {
    for (let x = 0; x <= boardWidth; x += 1) {
      const nw = getCellColor(x - 1, y - 1);
      const ne = getCellColor(x, y - 1);
      const sw = getCellColor(x - 1, y);
      const se = getCellColor(x, y);

      const topVerticalBoundary = hasBoundary(nw, ne);
      const bottomVerticalBoundary = hasBoundary(sw, se);
      const leftHorizontalBoundary = hasBoundary(nw, sw);
      const rightHorizontalBoundary = hasBoundary(ne, se);

      if (!(topVerticalBoundary || bottomVerticalBoundary) || !(leftHorizontalBoundary || rightHorizontalBoundary)) {
        continue;
      }

      fillRect(seamCoordX(x), seamCoordY(y), borderPixels, borderPixels, borderR, borderG, borderB, borderA);
    }
  }
}
