import { SPAWN_Y } from './constants';
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

/**
 * Spawn / block-out placement: cells above the playfield (worldY &lt; 0) are ignored for stack
 * collision; every cell that lies in the playfield must be empty. At least one cell must lie
 * in-bounds vertically so the piece is not entirely above the board.
 */
export function isLenientSpawnPosition(
  gameState: Pick<GameState, 'boardSize' | 'cells'>,
  piece: ActivePiece,
  targetX: number,
  targetY: number
): boolean {
  const { width, height } = gameState.boardSize;
  let touchesPlayfield = false;

  for (const cell of piece.cells) {
    const worldX = targetX + cell.x;
    const worldY = targetY + cell.y;

    if (worldX < 0 || worldX >= width) {
      return false;
    }
    if (worldY >= height) {
      return false;
    }
    if (worldY >= 0) {
      touchesPlayfield = true;
      const cellIndex = worldY * width + worldX;
      if (gameState.cells[cellIndex] !== 0) {
        return false;
      }
    }
  }

  return touchesPlayfield;
}

/** Highest Y (closest to default spawn) where lenient spawn is valid, or null. */
export function findLenientSpawnY(
  gameState: Pick<GameState, 'boardSize' | 'cells'>,
  piece: ActivePiece,
  spawnX: number
): number | null {
  const maxKickUp = 12;
  for (let y = SPAWN_Y; y >= SPAWN_Y - maxKickUp; y -= 1) {
    if (isLenientSpawnPosition(gameState, piece, spawnX, y)) {
      return y;
    }
  }
  return null;
}

export function willCollideAtOffset(
  gameState: Pick<GameState, 'boardSize' | 'cells'>,
  piece: ActivePiece,
  offsetX: number,
  offsetY: number
): boolean {
  return !isValidPosition(gameState, piece, piece.position.x + offsetX, piece.position.y + offsetY);
}
