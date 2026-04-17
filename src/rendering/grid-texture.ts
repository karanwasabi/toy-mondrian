import { BufferImageSource, Texture } from 'pixi.js';
import { GRID_HEIGHT, GRID_WIDTH, MONDRIAN_COLOR_HEX } from '../engine/constants';
import { CellColorId, type GameState } from '../engine/types';

type Rgba = readonly [number, number, number, number];
type CellState = { color: number };

const PALETTE_RGBA: Readonly<Record<number, Rgba>> = {
  [CellColorId.Empty]: [0, 0, 0, 0],
  [CellColorId.Red]: hexToRgba(MONDRIAN_COLOR_HEX[CellColorId.Red]),
  [CellColorId.Blue]: hexToRgba(MONDRIAN_COLOR_HEX[CellColorId.Blue]),
  [CellColorId.Yellow]: hexToRgba(MONDRIAN_COLOR_HEX[CellColorId.Yellow]),
  [CellColorId.White]: hexToRgba(MONDRIAN_COLOR_HEX[CellColorId.White]),
};

const BOARD_BG_RGBA: Rgba = [240, 240, 240, 255];
const BORDER_RGBA: Rgba = [17, 17, 17, 255];
const CELL_PIXELS = 12;
const BORDER_PIXELS = 2;
const TEXTURE_WIDTH = GRID_WIDTH * CELL_PIXELS;
const TEXTURE_HEIGHT = GRID_HEIGHT * CELL_PIXELS;

export class GridTextureBridge {
  private readonly buffer: Uint8Array;

  private readonly source: BufferImageSource;

  readonly texture: Texture<BufferImageSource>;

  constructor() {
    this.buffer = new Uint8Array(TEXTURE_WIDTH * TEXTURE_HEIGHT * 4);
    this.source = new BufferImageSource({
      resource: this.buffer,
      width: TEXTURE_WIDTH,
      height: TEXTURE_HEIGHT,
      alphaMode: 'premultiplied-alpha',
    });
    this.source.minFilter = 'nearest';
    this.source.magFilter = 'nearest';
    this.texture = new Texture({
      source: this.source,
      dynamic: true,
      label: 'mondrian-grid-texture',
    });
  }

  composeWithActivePiece(state: GameState): void {
    this.fillBoardBackground();
    const boardWidth = state.boardSize.width;
    const boardHeight = state.boardSize.height;
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

    for (let y = 0; y < boardHeight; y += 1) {
      for (let x = 0; x < boardWidth; x += 1) {
        const index = y * boardWidth + x;
        const color = cells[index].color;
        if (color === CellColorId.Empty) {
          continue;
        }
        this.fillCell(x, y, color);
      }
    }

    this.drawBorders(cells, boardWidth, boardHeight);
    this.drawCornerJoins(cells, boardWidth, boardHeight);

    this.source.update();
  }

  private fillBoardBackground(): void {
    const [r, g, b, a] = BOARD_BG_RGBA;
    for (let i = 0; i < this.buffer.length; i += 4) {
      this.buffer[i] = r;
      this.buffer[i + 1] = g;
      this.buffer[i + 2] = b;
      this.buffer[i + 3] = a;
    }
  }

  private fillCell(gridX: number, gridY: number, colorId: number): void {
    const [fillR, fillG, fillB, fillA] = PALETTE_RGBA[colorId] ?? PALETTE_RGBA[CellColorId.Empty];
    const cellStartX = gridX * CELL_PIXELS;
    const cellStartY = gridY * CELL_PIXELS;

    this.fillRect(cellStartX, cellStartY, CELL_PIXELS, CELL_PIXELS, fillR, fillG, fillB, fillA);
  }

  private drawBorders(cells: CellState[], boardWidth: number, boardHeight: number): void {
    const [borderR, borderG, borderB, borderA] = BORDER_RGBA;

    // Vertical seams (between x-1 and x).
    for (let y = 0; y < boardHeight; y += 1) {
      for (let x = 0; x <= boardWidth; x += 1) {
        const left = this.getCellColor(cells, boardWidth, boardHeight, x - 1, y);
        const right = this.getCellColor(cells, boardWidth, boardHeight, x, y);
        if (!this.hasBoundary(left, right)) {
          continue;
        }

        const seamX = this.seamCoordX(x, boardWidth);
        this.fillRect(seamX, y * CELL_PIXELS, BORDER_PIXELS, CELL_PIXELS, borderR, borderG, borderB, borderA);
      }
    }

    // Horizontal seams (between y-1 and y).
    for (let y = 0; y <= boardHeight; y += 1) {
      for (let x = 0; x < boardWidth; x += 1) {
        const top = this.getCellColor(cells, boardWidth, boardHeight, x, y - 1);
        const bottom = this.getCellColor(cells, boardWidth, boardHeight, x, y);
        if (!this.hasBoundary(top, bottom)) {
          continue;
        }

        const seamY = this.seamCoordY(y, boardHeight);
        this.fillRect(x * CELL_PIXELS, seamY, CELL_PIXELS, BORDER_PIXELS, borderR, borderG, borderB, borderA);
      }
    }
  }

  private drawCornerJoins(cells: CellState[], boardWidth: number, boardHeight: number): void {
    const [borderR, borderG, borderB, borderA] = BORDER_RGBA;

    for (let y = 0; y <= boardHeight; y += 1) {
      for (let x = 0; x <= boardWidth; x += 1) {
        const nw = this.getCellColor(cells, boardWidth, boardHeight, x - 1, y - 1);
        const ne = this.getCellColor(cells, boardWidth, boardHeight, x, y - 1);
        const sw = this.getCellColor(cells, boardWidth, boardHeight, x - 1, y);
        const se = this.getCellColor(cells, boardWidth, boardHeight, x, y);

        const topVerticalBoundary = this.hasBoundary(nw, ne);
        const bottomVerticalBoundary = this.hasBoundary(sw, se);
        const leftHorizontalBoundary = this.hasBoundary(nw, sw);
        const rightHorizontalBoundary = this.hasBoundary(ne, se);

        if (!(topVerticalBoundary || bottomVerticalBoundary) || !(leftHorizontalBoundary || rightHorizontalBoundary)) {
          continue;
        }

        this.fillRect(
          this.seamCoordX(x, boardWidth),
          this.seamCoordY(y, boardHeight),
          BORDER_PIXELS,
          BORDER_PIXELS,
          borderR,
          borderG,
          borderB,
          borderA
        );
      }
    }
  }

  private getCellColor(cells: CellState[], boardWidth: number, boardHeight: number, x: number, y: number): number {
    if (x < 0 || x >= boardWidth || y < 0 || y >= boardHeight) {
      return CellColorId.Empty;
    }
    return cells[y * boardWidth + x].color;
  }

  private hasBoundary(a: number, b: number): boolean {
    return a !== b && !(a === CellColorId.Empty && b === CellColorId.Empty);
  }

  private seamCoordX(x: number, boardWidth: number): number {
    return x === boardWidth ? TEXTURE_WIDTH - BORDER_PIXELS : x * CELL_PIXELS;
  }

  private seamCoordY(y: number, boardHeight: number): number {
    return y === boardHeight ? TEXTURE_HEIGHT - BORDER_PIXELS : y * CELL_PIXELS;
  }

  private writePixel(x: number, y: number, r: number, g: number, b: number, a: number): void {
    const offset = (y * TEXTURE_WIDTH + x) * 4;
    this.buffer[offset] = r;
    this.buffer[offset + 1] = g;
    this.buffer[offset + 2] = b;
    this.buffer[offset + 3] = a;
  }

  private fillRect(
    x: number,
    y: number,
    width: number,
    height: number,
    r: number,
    g: number,
    b: number,
    a: number
  ): void {
    for (let py = 0; py < height; py += 1) {
      for (let px = 0; px < width; px += 1) {
        this.writePixel(x + px, y + py, r, g, b, a);
      }
    }
  }
}

function hexToRgba(hex: string): Rgba {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  return [r, g, b, 255];
}
