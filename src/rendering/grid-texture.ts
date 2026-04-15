import { BufferImageSource, Texture } from 'pixi.js';
import { GRID_HEIGHT, GRID_WIDTH, MONDRIAN_COLOR_HEX } from '../engine/constants';
import { CellColorId, type GameState } from '../engine/types';

type Rgba = readonly [number, number, number, number];

const PALETTE_RGBA: Readonly<Record<number, Rgba>> = {
  [CellColorId.Empty]: [0, 0, 0, 0],
  [CellColorId.Red]: hexToRgba(MONDRIAN_COLOR_HEX[CellColorId.Red]),
  [CellColorId.Blue]: hexToRgba(MONDRIAN_COLOR_HEX[CellColorId.Blue]),
  [CellColorId.Yellow]: hexToRgba(MONDRIAN_COLOR_HEX[CellColorId.Yellow]),
  [CellColorId.White]: hexToRgba(MONDRIAN_COLOR_HEX[CellColorId.White]),
};

export class GridTextureBridge {
  private readonly buffer: Uint8Array;

  private readonly source: BufferImageSource;

  readonly texture: Texture<BufferImageSource>;

  constructor() {
    this.buffer = new Uint8Array(GRID_WIDTH * GRID_HEIGHT * 4);
    this.source = new BufferImageSource({
      resource: this.buffer,
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
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
    this.buffer.fill(0);
    const boardWidth = state.boardSize.width;

    for (let index = 0; index < state.cells.length; index += 1) {
      const colorId = state.cells[index];
      if (colorId === CellColorId.Empty) {
        continue;
      }

      this.writeColorAtIndex(index, colorId);
    }

    const activePiece = state.activePiece;
    if (activePiece) {
      for (const cell of activePiece.cells) {
        const worldX = activePiece.position.x + cell.x;
        const worldY = activePiece.position.y + cell.y;

        if (worldX < 0 || worldX >= boardWidth || worldY < 0 || worldY >= state.boardSize.height) {
          continue;
        }

        const index = worldY * boardWidth + worldX;
        this.writeColorAtIndex(index, cell.color);
      }
    }

    this.source.update();
  }

  private writeColorAtIndex(cellIndex: number, colorId: number): void {
    const [r, g, b, a] = PALETTE_RGBA[colorId] ?? PALETTE_RGBA[CellColorId.Empty];
    const offset = cellIndex * 4;
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
