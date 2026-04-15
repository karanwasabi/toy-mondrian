import './style.css';
import { EngineRuntime } from './engine/runtime';
import { createPixiApp } from './rendering/pixi-app';
import { MondrianScene } from './rendering/scene';
import { createUIRoot } from './ui/create-ui-root';

async function bootstrap(): Promise<void> {
  const appHost = document.querySelector<HTMLDivElement>('#app');
  if (!appHost) {
    throw new Error('Missing #app root element');
  }

  const app = await createPixiApp();
  appHost.appendChild(app.canvas);

  const uiRoot = createUIRoot();
  appHost.appendChild(uiRoot);

  const scene = new MondrianScene(app);
  const runtime = new EngineRuntime({ seed: 1 });
  runtime.onSnapshot((state) => {
    scene.renderSnapshot(state);
  });

  runtime.start();
}

void bootstrap();
