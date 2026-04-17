import { GamePhase, type GameState } from '../engine/types';

let scoreValueEl: HTMLSpanElement | null = null;
let timeValueEl: HTMLSpanElement | null = null;
let statusValueEl: HTMLSpanElement | null = null;
let ledScreenEl: HTMLDivElement | null = null;
let downloadButtonEl: HTMLButtonElement | null = null;
let restartButtonEl: HTMLButtonElement | null = null;

type SetupHudOptions = {
  onDownloadVectorArt?: () => void;
  onRestart?: () => void;
};

export function setupHud(uiRoot: HTMLElement, options: SetupHudOptions = {}): void {
  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.innerHTML = `
    <div class="hud-panel hud-panel-score">
      <span class="hud-label">SCORE</span>
      <span class="hud-value" data-hud-score>0</span>
    </div>
    <div class="hud-panel hud-panel-time">
      <span class="hud-label">TIME</span>
      <span class="hud-value" data-hud-time>0</span>
    </div>
    <div class="hud-panel hud-panel-controls">
      <div class="hud-led-screen" role="status" aria-live="polite">
        <span class="hud-led-text" data-hud-status>READY TO PAINT</span>
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
          aria-label="Download SVG artwork"
          title="Download SVG artwork"
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
  downloadButtonEl = hud.querySelector<HTMLButtonElement>('[data-hud-download]');
  restartButtonEl = hud.querySelector<HTMLButtonElement>('[data-hud-restart]');

  if (downloadButtonEl) {
    downloadButtonEl.addEventListener('click', () => {
      options.onDownloadVectorArt?.();
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
    scoreValueEl.textContent = String(state.score);
  }
  if (timeValueEl) {
    timeValueEl.textContent = String(state.secondsElapsed);
  }
  if (statusValueEl) {
    statusValueEl.textContent = state.phase === GamePhase.GalleryClosed ? 'ARTWORK READY' : 'PAINTING IN PROGRESS';
  }
  if (ledScreenEl) {
    const isFinished = state.phase === GamePhase.GalleryClosed;
    ledScreenEl.classList.toggle('state-running', !isFinished);
    ledScreenEl.classList.toggle('state-finished', state.phase === GamePhase.GalleryClosed);
  }
  if (downloadButtonEl) {
    downloadButtonEl.disabled = state.phase !== GamePhase.GalleryClosed;
    downloadButtonEl.classList.toggle('disabled', downloadButtonEl.disabled);
  }
}
