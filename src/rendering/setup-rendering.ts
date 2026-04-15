import { Application, Container, Graphics } from 'pixi.js'
import type { GameState } from '../engine/game-state'

const BOARD_ASPECT_RATIO = 1 / 2
const CELL_SIZE = 10

export function setupRendering(app: Application, gameState: GameState): void {
  const logicalBoardWidth = gameState.boardSize.width * CELL_SIZE
  const logicalBoardHeight = gameState.boardSize.height * CELL_SIZE

  const boardContainer = new Container()
  const boardBackground = new Graphics()

  boardBackground.rect(0, 0, logicalBoardWidth, logicalBoardHeight).fill({
    color: 0xffffff,
    alpha: 0.8,
  })
  boardBackground
    .rect(0, 0, logicalBoardWidth, logicalBoardHeight)
    .stroke({ color: 0x111111, width: 1.5, alpha: 0.9 })

  boardContainer.addChild(boardBackground)
  app.stage.addChild(boardContainer)

  const resizeBoard = (): void => {
    const { width: viewportWidth, height: viewportHeight } = app.screen
    const constrainedBoardWidth = Math.min(
      viewportWidth,
      viewportHeight * BOARD_ASPECT_RATIO,
    )
    const scale = constrainedBoardWidth / logicalBoardWidth

    boardContainer.scale.set(scale)
    boardContainer.position.set(
      (viewportWidth - logicalBoardWidth * scale) * 0.5,
      (viewportHeight - logicalBoardHeight * scale) * 0.5,
    )
  }

  resizeBoard()

  app.renderer.on('resize', resizeBoard)
}
