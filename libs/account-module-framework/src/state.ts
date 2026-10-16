import type { JsonValue, StateStore, Versioned } from "./types";

export type MemoryStateStore<State extends JsonValue = JsonValue> = StateStore<State> & {
  /** Synchronous snapshot: the last state put, or the initial one. */
  snapshot: () => Versioned<State> | undefined;
};

/** A state kept in memory: for tests, and for clients that persist the snapshot themselves. */
export function createMemoryStateStore<State extends JsonValue = JsonValue>(
  initial?: Versioned<State>,
): MemoryStateStore<State> {
  let state = initial;
  return {
    snapshot: () => state,
    get: async () => state,
    put: async next => {
      state = next;
    },
  };
}
