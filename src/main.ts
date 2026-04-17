import './style.css';
import { EngineRuntime } from './engine/runtime';
import { GamePhase, type GameState } from './engine/types';
import { createPixiApp } from './rendering/pixi-app';
import { MondrianScene } from './rendering/scene';
import { createUIRoot } from './ui/create-ui-root';
import { setupKeyboard } from './ui/keyboard-controller';
import { setupTouch } from './ui/touch-controller';
import { exportVectorArt } from './ui/gallery-export';
import { setupHud, updateHud } from './ui/hud';

async function bootstrap(): Promise<void> {
  const appHost = document.querySelector<HTMLDivElement>('#app');
  if (!appHost) {
    throw new Error('Missing #app root element');
  }

  const app = await createPixiApp(appHost);
  appHost.appendChild(app.canvas);

  let latestState: GameState | null = null;
  const uiRoot = createUIRoot();
  appHost.appendChild(uiRoot);
  setupHud(uiRoot, {
    onDownloadVectorArt: async () => {
      if (!latestState || latestState.phase !== GamePhase.GalleryClosed) {
        return;
      }

      const svg = await exportVectorArt(
        latestState.cells,
        latestState.boardSize.width,
        latestState.boardSize.height,
        50
      );

      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'toy-mondrian.svg';
      link.click();
      URL.revokeObjectURL(url);
    },
  });

  const scene = new MondrianScene(app);
  const runtime = new EngineRuntime({ seed: 1 });
  const canDispatchInput = (): boolean => runtime.getState().phase !== GamePhase.GalleryClosed;
  setupKeyboard((command) => runtime.enqueueCommand(command, 'keyboard'), canDispatchInput);
  setupTouch((command) => runtime.enqueueCommand(command, 'touch'), canDispatchInput);

  runtime.onSnapshot((state) => {
    latestState = state;
    scene.renderSnapshot(state);
    updateHud(state);
  });

  runtime.start();
}

void bootstrap();
