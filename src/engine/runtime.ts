import { createInitialGameState } from './game-state';
import { reduce } from './reducer';
import type { CommandSource, GameState, InputCommand, QueuedCommand, TickAction } from './types';

type SnapshotListener = (state: GameState) => void;

type RuntimeOptions = {
  seed: number;
};

export class EngineRuntime {
  private state: GameState;

  private seed: number;

  private listeners = new Set<SnapshotListener>();

  private queuedCommands: QueuedCommand[] = [];

  private sequence = 0;

  private rafId: number | null = null;

  private lastFrameTime = 0;

  private readonly onDocumentVisibilityChange = (): void => {
    this.lastFrameTime = 0;
  };

  constructor(options: RuntimeOptions) {
    this.seed = options.seed;
    this.state = createInitialGameState(options.seed);
  }

  start(): void {
    if (this.rafId !== null) {
      return;
    }

    this.lastFrameTime = 0;
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onDocumentVisibilityChange);
    }
    this.rafId = requestAnimationFrame(this.onFrame);
    this.emitSnapshot();
  }

  stop(): void {
    if (this.rafId === null) {
      return;
    }
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onDocumentVisibilityChange);
    }
  }

  enqueueCommand(command: InputCommand, source: CommandSource = 'keyboard'): void {
    this.queuedCommands.push({
      command,
      tick: this.state.tick + 1,
      source,
      sequence: this.sequence,
    });
    this.sequence += 1;
  }

  onSnapshot(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): GameState {
    return this.state;
  }

  restart(seed: number = this.seed): void {
    this.seed = seed;
    this.state = createInitialGameState(seed);
    this.queuedCommands = [];
    this.sequence = 0;
    this.lastFrameTime = 0;
    this.emitSnapshot();
  }

  private onFrame = (time: number): void => {
    const rawDeltaMs = this.lastFrameTime === 0 ? 0 : time - this.lastFrameTime;
    this.lastFrameTime = time;
    const tabFocused = typeof document === 'undefined' || document.visibilityState === 'visible';
    const deltaMs = tabFocused ? rawDeltaMs : 0;

    let nextState = this.state;
    if (this.queuedCommands.length > 0) {
      for (const queuedCommand of this.queuedCommands) {
        nextState = reduce(nextState, queuedCommand);
      }
      this.queuedCommands = [];
    }

    const tickAction: TickAction = {
      type: 'TickAction',
      deltaMs,
    };
    nextState = reduce(nextState, tickAction);
    this.state = nextState;

    this.emitSnapshot();
    this.rafId = requestAnimationFrame(this.onFrame);
  };

  private emitSnapshot(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
