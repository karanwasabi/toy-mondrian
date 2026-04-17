import { Application } from 'pixi.js';

const BACKGROUND_COLOR = 0xffffff;

export async function createPixiApp(hostElement: HTMLElement): Promise<Application> {
  const app = new Application();
  await app.init({
    background: BACKGROUND_COLOR,
    resizeTo: hostElement,
    antialias: true,
    preference: 'webgl',
  });

  return app;
}
