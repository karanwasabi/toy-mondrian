import './style.css';
import { EngineRuntime } from './engine/runtime';
import { GamePhase } from './engine/types';
import { createPixiApp } from './rendering/pixi-app';
import { MondrianScene } from './rendering/scene';
import { createUIRoot } from './ui/create-ui-root';
import { setupKeyboard } from './ui/keyboard-controller';
import { setupTouch } from './ui/touch-controller';
import { setupHud, updateHud } from './ui/hud';

async function bootstrap(): Promise<void> {
  const appHost = document.querySelector<HTMLDivElement>('#app');
  if (!appHost) {
    throw new Error('Missing #app root element');
  }

  const app = await createPixiApp();
  appHost.appendChild(app.canvas);

  const uiRoot = createUIRoot();
  appHost.appendChild(uiRoot);
  setupHud(uiRoot);

  const scene = new MondrianScene(app);
  const runtime = new EngineRuntime({ seed: 1 });
  const canDispatchInput = (): boolean => runtime.getState().phase !== GamePhase.GalleryClosed;
  setupKeyboard((command) => runtime.enqueueCommand(command, 'keyboard'), canDispatchInput);
  setupTouch((command) => runtime.enqueueCommand(command, 'touch'), canDispatchInput);

  runtime.onSnapshot((state) => {
    scene.renderSnapshot(state);
    updateHud(state);
  });

  runtime.start();
}

void bootstrap();
