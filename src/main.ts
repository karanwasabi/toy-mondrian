import './style.css'
import { Application } from 'pixi.js'
import { createInitialGameState } from './engine/game-state'
import { setupRendering } from './rendering/setup-rendering'
import { createUIRoot } from './ui/create-ui-root'

const BACKGROUND_COLOR = 0xf0f0f0

async function bootstrap(): Promise<void> {
  const appHost = document.querySelector<HTMLDivElement>('#app')
  if (!appHost) {
    throw new Error('Missing #app root element')
  }

  const app = new Application()
  await app.init({
    background: BACKGROUND_COLOR,
    resizeTo: window,
    antialias: true,
  })
  appHost.appendChild(app.canvas)

  const uiRoot = createUIRoot()
  appHost.appendChild(uiRoot)

  const gameState = createInitialGameState()
  setupRendering(app, gameState)
}

void bootstrap()
