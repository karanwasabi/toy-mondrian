import { PIECE_LOCAL_CELLS } from '../engine/constants';
import { getNextPiece } from '../engine/piece-bag';
import { GamePhase, type CellColorId, type GameState } from '../engine/types';

const PREVIEW_GRID_SIZE = 4;
const PREVIEW_CELL_PIXELS = 10;
const PREVIEW_BORDER_PIXELS = 2;
const PREVIEW_PADDING_PIXELS = 5;
const PREVIEW_TEXTURE_SIZE = PREVIEW_GRID_SIZE * PREVIEW_CELL_PIXELS + PREVIEW_PADDING_PIXELS * 2;

let scoreValueEl: HTMLSpanElement | null = null;
let timeValueEl: HTMLSpanElement | null = null;
let statusValueEl: HTMLSpanElement | null = null;
let ledScreenEl: HTMLDivElement | null = null;
let nextPieceCanvasEl: HTMLCanvasElement | null = null;
let downloadButtonEl: HTMLButtonElement | null = null;
let restartButtonEl: HTMLButtonElement | null = null;

type SetupHudOptions = {
  onDownload?: () => void;
  onRestart?: () => void;
};

export function setupHud(uiRoot: HTMLElement, options: SetupHudOptions = {}): void {
  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.innerHTML = `
    <div class="hud-panel hud-panel-score">
      <span class="hud-label">BLOCKS</span>
      <span class="hud-value" data-hud-score>0</span>
    </div>
    <div class="hud-panel hud-panel-time">
      <span class="hud-label">TIME</span>
      <span class="hud-value" data-hud-time>0</span>
    </div>
    <div class="hud-panel hud-panel-controls">
      <div class="hud-led-screen" role="status" aria-live="polite">
        <span class="hud-led-text" data-hud-status>ARTWORK READY!</span>
        <div class="hud-next-piece" aria-label="Next piece preview">
          <span class="hud-next-piece-label">NEXT SHAPE</span>
          <canvas class="hud-next-piece-preview" data-hud-next-piece width="${PREVIEW_TEXTURE_SIZE}" height="${PREVIEW_TEXTURE_SIZE}"></canvas>
        </div>
      </div>
      <div class="hud-controls">
        <button
          type="button"
          class="hud-control-button hud-control-restart"
          data-hud-restart
          aria-label="Restart artwork"
          title="Restart artwork"
        >
          <span class="hud-control-icon" aria-hidden="true">
            <svg class="hud-control-icon-svg" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M4 12a8 8 0 1 0 2.35-5.65" />
              <path d="M4 5v4h4" />
            </svg>
          </span>
          <span class="hud-control-label">Restart</span>
        </button>
        <button
          type="button"
          class="hud-control-button hud-control-download disabled"
          data-hud-download
          aria-label="Download artwork"
          title="Download artwork"
        >
          <span class="hud-control-icon" aria-hidden="true">
            <svg class="hud-control-icon-svg" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M12 4v10" />
              <path d="M8 11l4 4 4-4" />
              <path d="M5 20h14" />
            </svg>
          </span>
          <span class="hud-control-label">Download</span>
        </button>
      </div>
    </div>
  `;

  uiRoot.appendChild(hud);
  scoreValueEl = hud.querySelector<HTMLSpanElement>('[data-hud-score]');
  timeValueEl = hud.querySelector<HTMLSpanElement>('[data-hud-time]');
  statusValueEl = hud.querySelector<HTMLSpanElement>('[data-hud-status]');
  ledScreenEl = hud.querySelector<HTMLDivElement>('.hud-led-screen');
  nextPieceCanvasEl = hud.querySelector<HTMLCanvasElement>('[data-hud-next-piece]');
  downloadButtonEl = hud.querySelector<HTMLButtonElement>('[data-hud-download]');
  restartButtonEl = hud.querySelector<HTMLButtonElement>('[data-hud-restart]');

  if (downloadButtonEl) {
    downloadButtonEl.addEventListener('click', () => {
      options.onDownload?.();
    });
  }
  if (restartButtonEl) {
    restartButtonEl.addEventListener('click', () => {
      options.onRestart?.();
    });
  }
}

export function updateHud(state: GameState): void {
  if (scoreValueEl) {
    scoreValueEl.textContent = String(Math.floor(state.blocksUsed / 4));
  }
  if (timeValueEl) {
    timeValueEl.textContent = String(state.secondsElapsed);
  }
  if (statusValueEl) {
    statusValueEl.textContent = 'ARTWORK READY!';
  }
  if (nextPieceCanvasEl && state.phase !== GamePhase.GalleryClosed) {
    renderNextPiecePreview(state, nextPieceCanvasEl);
  }
  if (ledScreenEl) {
    const isFinished = state.phase === GamePhase.GalleryClosed;
    ledScreenEl.classList.toggle('state-running', !isFinished);
    ledScreenEl.classList.toggle('state-finished', isFinished);
  }
  if (downloadButtonEl) {
    downloadButtonEl.disabled = state.phase !== GamePhase.GalleryClosed;
    downloadButtonEl.classList.toggle('disabled', downloadButtonEl.disabled);
  }
}

function renderNextPiecePreview(state: GameState, target: HTMLCanvasElement): void {
  const { pieceKind, colorId } = getNextPiece(state.rngState, state.pieceBag);
  const pieceCells = PIECE_LOCAL_CELLS[pieceKind];
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const cell of pieceCells) {
    if (cell.x < minX) minX = cell.x;
    if (cell.y < minY) minY = cell.y;
    if (cell.x > maxX) maxX = cell.x;
    if (cell.y > maxY) maxY = cell.y;
  }

  const pieceWidth = maxX - minX + 1;
  const pieceHeight = maxY - minY + 1;
  const offsetX = Math.floor((4 - pieceWidth) / 2);
  const offsetY = Math.floor((4 - pieceHeight) / 2);
  const occupied = new Set<string>();
  const normalizedOccupied = new Set<string>();
  for (const cell of pieceCells) {
    const x = cell.x - minX + offsetX;
    const y = cell.y - minY + offsetY;
    occupied.add(`${x},${y}`);
    normalizedOccupied.add(`${x},${y}`);
  }
  const ctx = target.getContext('2d');
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, target.width, target.height);
  const pieceColor = colorToHex(colorId);

  for (const coord of normalizedOccupied) {
    const [xString, yString] = coord.split(',');
    const x = Number(xString);
    const y = Number(yString);
    ctx.fillStyle = pieceColor;
    ctx.fillRect(cellCoordX(x), cellCoordY(y), PREVIEW_CELL_PIXELS, PREVIEW_CELL_PIXELS);
  }

  ctx.fillStyle = '#111111';
  for (let seamX = 0; seamX <= PREVIEW_GRID_SIZE; seamX += 1) {
    for (let y = 0; y < PREVIEW_GRID_SIZE; y += 1) {
      if (!hasBoundary(normalizedOccupied, seamX - 1, y, seamX, y)) {
        continue;
      }
      ctx.fillRect(verticalBorderX(seamX), cellCoordY(y), PREVIEW_BORDER_PIXELS, PREVIEW_CELL_PIXELS);
    }
  }
  for (let seamY = 0; seamY <= PREVIEW_GRID_SIZE; seamY += 1) {
    for (let x = 0; x < PREVIEW_GRID_SIZE; x += 1) {
      if (!hasBoundary(normalizedOccupied, x, seamY - 1, x, seamY)) {
        continue;
      }
      ctx.fillRect(cellCoordX(x), horizontalBorderY(seamY), PREVIEW_CELL_PIXELS, PREVIEW_BORDER_PIXELS);
    }
  }
  drawPreviewCornerJoins(ctx, normalizedOccupied);
}

function drawPreviewCornerJoins(ctx: CanvasRenderingContext2D, occupied: Set<string>): void {
  for (let y = 0; y <= PREVIEW_GRID_SIZE; y += 1) {
    for (let x = 0; x <= PREVIEW_GRID_SIZE; x += 1) {
      const touchesVertical = hasBoundary(occupied, x - 1, y - 1, x, y - 1) || hasBoundary(occupied, x - 1, y, x, y);
      const touchesHorizontal = hasBoundary(occupied, x - 1, y - 1, x - 1, y) || hasBoundary(occupied, x, y - 1, x, y);
      if (!(touchesVertical && touchesHorizontal)) {
        continue;
      }
      ctx.fillRect(verticalBorderX(x), horizontalBorderY(y), PREVIEW_BORDER_PIXELS, PREVIEW_BORDER_PIXELS);
    }
  }
}

function hasBoundary(occupied: Set<string>, leftX: number, leftY: number, rightX: number, rightY: number): boolean {
  return isOccupied(occupied, leftX, leftY) !== isOccupied(occupied, rightX, rightY);
}

function isOccupied(occupied: Set<string>, x: number, y: number): boolean {
  if (x < 0 || x >= PREVIEW_GRID_SIZE || y < 0 || y >= PREVIEW_GRID_SIZE) {
    return false;
  }
  return occupied.has(`${x},${y}`);
}

function seamCoordX(seamX: number): number {
  return PREVIEW_PADDING_PIXELS + seamX * PREVIEW_CELL_PIXELS;
}

function seamCoordY(seamY: number): number {
  return PREVIEW_PADDING_PIXELS + seamY * PREVIEW_CELL_PIXELS;
}

function cellCoordX(cellX: number): number {
  return seamCoordX(cellX);
}

function cellCoordY(cellY: number): number {
  return seamCoordY(cellY);
}

function verticalBorderX(seamX: number): number {
  return seamCoordX(seamX) - PREVIEW_BORDER_PIXELS / 2;
}

function horizontalBorderY(seamY: number): number {
  return seamCoordY(seamY) - PREVIEW_BORDER_PIXELS / 2;
}

function colorToHex(color: CellColorId): string {
  if (color === 1) {
    return '#e70503';
  }
  if (color === 2) {
    return '#0300ad';
  }
  if (color === 3) {
    return '#fdde06';
  }
  return '#ffffff';
}
