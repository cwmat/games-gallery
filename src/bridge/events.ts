// Typed event bus connecting the Phaser game and the React UI.
// MUST NOT import Phaser or React — kept dependency-free so either side can
// import it without pulling in the other.

export type Mode = 'manual' | 'auto';

/** Game moments the audio layer (and any future reactive UI) can score. */
export type FxKind = 'whip' | 'shatter' | 'reopen' | 'enemy-die';

export interface BridgeEvents {
  'lantern:broken': { gameId: string };
  'card:closed': void;
  'mode:changed': { mode: Mode };
  fx: { kind: FxKind };
}

type Listener<T> = (payload: T) => void;

// Overload signatures so callers get exact payload typing per-event,
// including the ability to call emit('card:closed') with no second argument.
type VoidKeys = { [K in keyof BridgeEvents]: BridgeEvents[K] extends void ? K : never }[keyof BridgeEvents];
type PayloadKeys = Exclude<keyof BridgeEvents, VoidKeys>;

let currentMode: Mode = 'manual';

export function getCurrentMode(): Mode {
  return currentMode;
}

export class Bridge {
  private listeners = new Map<keyof BridgeEvents, Set<Listener<unknown>>>();

  on<K extends keyof BridgeEvents>(event: K, listener: Listener<BridgeEvents[K]>): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<unknown>);
  }

  off<K extends keyof BridgeEvents>(event: K, listener: Listener<BridgeEvents[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  emit<K extends PayloadKeys>(event: K, payload: BridgeEvents[K]): void;
  emit<K extends VoidKeys>(event: K): void;
  emit<K extends keyof BridgeEvents>(event: K, payload?: BridgeEvents[K]): void {
    if (event === 'mode:changed') {
      currentMode = (payload as BridgeEvents['mode:changed']).mode;
    }
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      listener(payload as BridgeEvents[K]);
    }
  }
}

export const bus = new Bridge();
