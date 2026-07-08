import type { StoreActionListener } from "../src/copyStore";
import { COPY_STORE_REPLACE } from "../src/copyStore";

export type MockState = Record<string, unknown>;

/**
 * Minimal store standing in for an RTK store + listener middleware.
 *
 * `dispatch` applies the action to state and then fires each registered listener
 * effect whose predicate passes — the same seam the copy-store protocol drives.
 * This lets protocol tests verify echo suppression through real behaviour rather
 * than spying on the predicate.
 */
export function createMockStore(initialState: MockState = {}) {
  let state: MockState = initialState;
  const listeners = new Set<{ predicate: () => boolean; effect: (action: unknown) => void }>();

  const listener: StoreActionListener = {
    startListening: options => {
      listeners.add(options);
      return () => listeners.delete(options);
    },
  };

  const dispatch = (action: unknown) => {
    const { type, payload } = action as { type: string; payload?: unknown };
    if (type === COPY_STORE_REPLACE) {
      if (payload !== undefined) state = payload as MockState;
    } else {
      state = { ...state, lastAction: type };
    }
    for (const l of listeners) if (l.predicate()) l.effect(action);
  };

  return {
    listener,
    dispatch,
    getSnapshot: () => state,
    setStoreState: (snapshot: unknown) => {
      state = snapshot as MockState;
    },
    getState: () => state,
  };
}
