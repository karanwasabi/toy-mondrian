import { GamePhase, type GameState } from '../engine/types';

let scoreValueEl: HTMLSpanElement | null = null;
let timeValueEl: HTMLSpanElement | null = null;
let statusValueEl: HTMLSpanElement | null = null;
let downloadButtonEl: HTMLButtonElement | null = null;

type SetupHudOptions = {
  onDownloadVectorArt?: () => void;
};

export function setupHud(uiRoot: HTMLElement, options: SetupHudOptions = {}): void {
  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.innerHTML = `
    <div class="hud-item">
      <span class="hud-label">Score</span>
      <span class="hud-value" data-hud-score>0</span>
    </div>
    <div class="hud-item">
      <span class="hud-label">Time</span>
      <span class="hud-value" data-hud-time>0</span>
    </div>
    <div class="hud-item">
      <span class="hud-label">Status</span>
      <span class="hud-value hud-status" data-hud-status>RUNNING</span>
    </div>
    <button type="button" class="hud-download hidden" data-hud-download>Download Vector Art (SVG)</button>
  `;

  uiRoot.appendChild(hud);
  scoreValueEl = hud.querySelector<HTMLSpanElement>('[data-hud-score]');
  timeValueEl = hud.querySelector<HTMLSpanElement>('[data-hud-time]');
  statusValueEl = hud.querySelector<HTMLSpanElement>('[data-hud-status]');
  downloadButtonEl = hud.querySelector<HTMLButtonElement>('[data-hud-download]');

  if (downloadButtonEl) {
    downloadButtonEl.addEventListener('click', () => {
      options.onDownloadVectorArt?.();
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
    statusValueEl.textContent =
      state.phase === GamePhase.GalleryClosed ? 'GALLERY CLOSED - ARTWORK FINISHED' : 'RUNNING';
  }
  if (downloadButtonEl) {
    downloadButtonEl.classList.toggle('hidden', state.phase !== GamePhase.GalleryClosed);
  }
}
