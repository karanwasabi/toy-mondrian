import type { GameState } from '../engine/types';

let scoreValueEl: HTMLSpanElement | null = null;
let timeValueEl: HTMLSpanElement | null = null;

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
  `;

  uiRoot.appendChild(hud);
  scoreValueEl = hud.querySelector<HTMLSpanElement>('[data-hud-score]');
  timeValueEl = hud.querySelector<HTMLSpanElement>('[data-hud-time]');
}

export function updateHud(state: GameState): void {
  if (scoreValueEl) {
    scoreValueEl.textContent = String(state.score);
  }
  if (timeValueEl) {
    timeValueEl.textContent = String(state.secondsElapsed);
  }
}
