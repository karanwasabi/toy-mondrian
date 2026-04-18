import { BufferImageSource, Texture } from 'pixi.js';
import { GRID_HEIGHT, GRID_WIDTH } from '../engine/constants';
import type { GameState } from '../engine/types';
import { composeBoardRgbaInto } from './compose-board-rgba';

const CELL_PIXELS = 12;
const BORDER_PIXELS = 2;

/** Native RGBA atlas size (`compose-board-rgba` layout). */
export const BOARD_TEXTURE_WIDTH = GRID_WIDTH * CELL_PIXELS;
export const BOARD_TEXTURE_HEIGHT = GRID_HEIGHT * CELL_PIXELS;

export class GridTextureBridge {
  private readonly buffer: Uint8Array;

  private readonly source: BufferImageSource;

  readonly texture: Texture<BufferImageSource>;

  constructor() {
    this.buffer = new Uint8Array(BOARD_TEXTURE_WIDTH * BOARD_TEXTURE_HEIGHT * 4);
    this.source = new BufferImageSource({
      resource: this.buffer,
      width: BOARD_TEXTURE_WIDTH,
      height: BOARD_TEXTURE_HEIGHT,
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
    composeBoardRgbaInto(state, CELL_PIXELS, BORDER_PIXELS, this.buffer, BOARD_TEXTURE_WIDTH, BOARD_TEXTURE_HEIGHT);
    this.source.update();
  }
}
