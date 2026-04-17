import { Container, Sprite } from 'pixi.js';
import { GridTextureBridge } from './grid-texture';
import type { Application } from 'pixi.js';
import type { GameState } from '../engine/types';

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
    this.boardSprite.roundPixels = true;

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
    this.boardSprite.width = Math.round(viewportWidth);
    this.boardSprite.height = Math.round(viewportHeight);
    this.boardContainer.scale.set(1, 1);
    this.boardContainer.position.set(0, 0);
  };
}
