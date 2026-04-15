import { createInitialGameState } from './game-state';
import { reduce } from './reducer';
import type { CommandSource, GameState, InputCommand, QueuedCommand, TickAction } from './types';

type SnapshotListener = (state: GameState) => void;

type RuntimeOptions = {
  seed: number;
};

export class EngineRuntime {
  private state: GameState;

  private listeners = new Set<SnapshotListener>();

  private queuedCommands: QueuedCommand[] = [];

  private sequence = 0;

  private rafId: number | null = null;

  private lastFrameTime = 0;

  constructor(options: RuntimeOptions) {
    this.state = createInitialGameState(options.seed);
  }

  start(): void {
    if (this.rafId !== null) {
      return;
    }

    this.lastFrameTime = 0;
    this.rafId = requestAnimationFrame(this.onFrame);
    this.emitSnapshot();
  }

  stop(): void {
    if (this.rafId === null) {
      return;
    }
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
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

  private onFrame = (time: number): void => {
    const deltaMs = this.lastFrameTime === 0 ? 0 : time - this.lastFrameTime;
    this.lastFrameTime = time;

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
