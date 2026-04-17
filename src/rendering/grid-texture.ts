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
const BORDER_PIXELS = 1;
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
        this.drawCell(x, y, color, cells, boardWidth, boardHeight);
      }
    }

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

  private drawCell(
    gridX: number,
    gridY: number,
    colorId: number,
    cells: CellState[],
    boardWidth: number,
    boardHeight: number
  ): void {
    const [fillR, fillG, fillB, fillA] = PALETTE_RGBA[colorId] ?? PALETTE_RGBA[CellColorId.Empty];
    const [borderR, borderG, borderB, borderA] = BORDER_RGBA;

    const cellStartX = gridX * CELL_PIXELS;
    const cellStartY = gridY * CELL_PIXELS;
    const localMax = CELL_PIXELS - 1;

    const hasNorthBorder = this.neighborColor(cells, boardWidth, boardHeight, gridX, gridY - 1) !== colorId;
    const hasSouthBorder = this.neighborColor(cells, boardWidth, boardHeight, gridX, gridY + 1) !== colorId;
    const hasWestBorder = this.neighborColor(cells, boardWidth, boardHeight, gridX - 1, gridY) !== colorId;
    const hasEastBorder = this.neighborColor(cells, boardWidth, boardHeight, gridX + 1, gridY) !== colorId;

    for (let py = 0; py < CELL_PIXELS; py += 1) {
      for (let px = 0; px < CELL_PIXELS; px += 1) {
        const onNorth = hasNorthBorder && py < BORDER_PIXELS;
        const onSouth = hasSouthBorder && py > localMax - BORDER_PIXELS;
        const onWest = hasWestBorder && px < BORDER_PIXELS;
        const onEast = hasEastBorder && px > localMax - BORDER_PIXELS;
        const isBorder = onNorth || onSouth || onWest || onEast;

        this.writePixel(
          cellStartX + px,
          cellStartY + py,
          isBorder ? borderR : fillR,
          isBorder ? borderG : fillG,
          isBorder ? borderB : fillB,
          isBorder ? borderA : fillA
        );
      }
    }
  }

  private neighborColor(cells: CellState[], boardWidth: number, boardHeight: number, x: number, y: number): number {
    if (x < 0 || x >= boardWidth || y < 0 || y >= boardHeight) {
      return CellColorId.Empty;
    }
    return cells[y * boardWidth + x].color;
  }

  private writePixel(x: number, y: number, r: number, g: number, b: number, a: number): void {
    const offset = (y * TEXTURE_WIDTH + x) * 4;
    this.buffer[offset] = r;
    this.buffer[offset + 1] = g;
    this.buffer[offset + 2] = b;
    this.buffer[offset + 3] = a;
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
