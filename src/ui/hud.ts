import { GamePhase, type GameState } from '../engine/types';

let scoreValueEl: HTMLSpanElement | null = null;
let timeValueEl: HTMLSpanElement | null = null;
let statusValueEl: HTMLSpanElement | null = null;

export function setupHud(uiRoot: HTMLElement): void {
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
  `;

  uiRoot.appendChild(hud);
  scoreValueEl = hud.querySelector<HTMLSpanElement>('[data-hud-score]');
  timeValueEl = hud.querySelector<HTMLSpanElement>('[data-hud-time]');
  statusValueEl = hud.querySelector<HTMLSpanElement>('[data-hud-status]');
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
}
