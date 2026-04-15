import { Container, Sprite, Texture } from 'pixi.js';
import { GRID_HEIGHT, GRID_WIDTH } from '../engine/constants';
import { createMondrianFilter } from './mondrian-filter';
import { GridTextureBridge } from './grid-texture';
import type { Application } from 'pixi.js';
import type { GameState } from '../engine/types';

const BOARD_ASPECT_RATIO = GRID_WIDTH / GRID_HEIGHT;
const LOGICAL_BOARD_WIDTH = 100;
const LOGICAL_BOARD_HEIGHT = LOGICAL_BOARD_WIDTH / BOARD_ASPECT_RATIO;

export class MondrianScene {
  private readonly app: Application;

  private readonly boardContainer: Container;

  private readonly boardSprite: Sprite;

  private readonly gridTextureBridge: GridTextureBridge;

  constructor(app: Application) {
    this.app = app;
    this.gridTextureBridge = new GridTextureBridge();
    this.boardContainer = new Container({ label: 'board-container' });
    this.boardSprite = new Sprite(Texture.WHITE);

    const filter = createMondrianFilter(this.gridTextureBridge.texture.source);
    this.boardSprite.filters = [filter];
    this.boardSprite.width = LOGICAL_BOARD_WIDTH;
    this.boardSprite.height = LOGICAL_BOARD_HEIGHT;

    this.boardContainer.addChild(this.boardSprite);
    this.app.stage.addChild(this.boardContainer);

    this.resize();
    this.app.renderer.on('resize', this.resize);
  }

  renderSnapshot(state: GameState): void {
    this.gridTextureBridge.composeWithActivePiece(state);
  }

  destroy(): void {
    this.app.renderer.off('resize', this.resize);
  }

  private resize = (): void => {
    const { width: viewportWidth, height: viewportHeight } = this.app.screen;
    const constrainedWidth = Math.min(viewportWidth, viewportHeight * BOARD_ASPECT_RATIO);
    const scale = constrainedWidth / LOGICAL_BOARD_WIDTH;

    this.boardContainer.scale.set(scale);
    this.boardContainer.position.set(
      (viewportWidth - LOGICAL_BOARD_WIDTH * scale) * 0.5,
      (viewportHeight - LOGICAL_BOARD_HEIGHT * scale) * 0.5
    );
  };
}
