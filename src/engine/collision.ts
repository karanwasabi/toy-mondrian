import type { ActivePiece, GameState } from './types';

export function isValidPosition(
  gameState: Pick<GameState, 'boardSize' | 'cells'>,
  piece: ActivePiece,
  targetX: number,
  targetY: number
): boolean {
  const { width, height } = gameState.boardSize;

  for (const cell of piece.cells) {
    const worldX = targetX + cell.x;
    const worldY = targetY + cell.y;

    if (worldX < 0 || worldX >= width || worldY < 0 || worldY >= height) {
      return false;
    }

    const cellIndex = worldY * width + worldX;
    if (gameState.cells[cellIndex] !== 0) {
      return false;
    }
  }

  return true;
}

export function willCollideAtOffset(
  gameState: Pick<GameState, 'boardSize' | 'cells'>,
  piece: ActivePiece,
  offsetX: number,
  offsetY: number
): boolean {
  return !isValidPosition(gameState, piece, piece.position.x + offsetX, piece.position.y + offsetY);
}
