import { GRID_HEIGHT, GRID_WIDTH } from '../engine/constants';
import type { GameState } from '../engine/types';
import { composeBoardRgbaInto } from '../rendering/compose-board-rgba';

const CELL_PIXELS = 12;
const BORDER_PIXELS = 2;
const SOURCE_WIDTH = GRID_WIDTH * CELL_PIXELS;
const SOURCE_HEIGHT = GRID_HEIGHT * CELL_PIXELS;

/** Long edge of output image (portrait board → height). */
const OUTPUT_MAX_EDGE_PX = 3840;

const JPEG_QUALITY = 0.92;

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('JPEG export failed'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

/**
 * Exports the finished board as a high-resolution JPEG (4K-class: 3840px on the long edge, nearest scaling).
 */
export async function exportBoardAs4kJpegBlob(state: GameState): Promise<Blob> {
  const rgba = new Uint8ClampedArray(SOURCE_WIDTH * SOURCE_HEIGHT * 4);
  composeBoardRgbaInto(state, CELL_PIXELS, BORDER_PIXELS, rgba, SOURCE_WIDTH, SOURCE_HEIGHT);

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = SOURCE_WIDTH;
  sourceCanvas.height = SOURCE_HEIGHT;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) {
    throw new Error('2D context unavailable');
  }
  sourceCtx.putImageData(new ImageData(rgba, SOURCE_WIDTH, SOURCE_HEIGHT), 0, 0);

  const scale = OUTPUT_MAX_EDGE_PX / SOURCE_HEIGHT;
  const outWidth = Math.round(SOURCE_WIDTH * scale);
  const outHeight = OUTPUT_MAX_EDGE_PX;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outWidth;
  outCanvas.height = outHeight;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) {
    throw new Error('2D context unavailable');
  }
  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(sourceCanvas, 0, 0, SOURCE_WIDTH, SOURCE_HEIGHT, 0, 0, outWidth, outHeight);

  return canvasToJpegBlob(outCanvas);
}
