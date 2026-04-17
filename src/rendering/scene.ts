import { Container, Sprite } from 'pixi.js';
import { GRID_HEIGHT, GRID_WIDTH } from '../engine/constants';
import { GridTextureBridge } from './grid-texture';
import type { Application } from 'pixi.js';
import type { GameState } from '../engine/types';

const LOGICAL_BOARD_WIDTH = 100;
const LOGICAL_BOARD_HEIGHT = LOGICAL_BOARD_WIDTH * (GRID_HEIGHT / GRID_WIDTH);

export class MondrianScene {
  private readonly app: Application;

  private readonly boardContainer: Container;

  private readonly boardSprite: Sprite;

  private readonly gridTextureBridge: GridTextureBridge;

  constructor(app: Application) {
    this.app = app;
    this.gridTextureBridge = new GridTextureBridge();
    this.boardContainer = new Container({ label: 'board-container' });
    this.boardSprite = new Sprite(this.gridTextureBridge.texture);
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
    const scaleX = viewportWidth / LOGICAL_BOARD_WIDTH;
    const scaleY = viewportHeight / LOGICAL_BOARD_HEIGHT;
    this.boardContainer.scale.set(scaleX, scaleY);
    this.boardContainer.position.set(0, 0);
  };
}
