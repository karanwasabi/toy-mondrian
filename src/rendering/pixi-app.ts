import { Application } from 'pixi.js';

const BACKGROUND_COLOR = 0xf0f0f0;

export async function createPixiApp(): Promise<Application> {
  const app = new Application();
  await app.init({
    background: BACKGROUND_COLOR,
    resizeTo: window,
    antialias: true,
    preference: 'webgl',
  });

  return app;
}
