import { CellColorId } from './types';
import { GRID_HEIGHT, GRID_WIDTH } from './constants';

export function processLineClears(grid: Uint8Array): { newGrid: Uint8Array; linesCleared: number } {
  const width = GRID_WIDTH;
  const height = GRID_HEIGHT;
  const keptRows: number[][] = [];
  let linesCleared = 0;

  for (let y = height - 1; y >= 0; y -= 1) {
    let isFullRow = true;
    const row: number[] = [];

    for (let x = 0; x < width; x += 1) {
      const value = grid[y * width + x];
      row.push(value);
      if (value === CellColorId.Empty) {
        isFullRow = false;
      }
    }

    if (isFullRow) {
      linesCleared += 1;
      continue;
    }

    keptRows.push(row);
  }

  const emptyRow = new Array<number>(width).fill(CellColorId.Empty);
  while (keptRows.length < height) {
    keptRows.push([...emptyRow]);
  }

  const rebuiltRows = keptRows.reverse();
  const newGrid = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    const row = rebuiltRows[y];
    for (let x = 0; x < width; x += 1) {
      newGrid[y * width + x] = row[x];
    }
  }

  return { newGrid, linesCleared };
}
