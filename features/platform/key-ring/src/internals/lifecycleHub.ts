import type { KeyRingLifecycle, KeyRingLifecycleEvent, KeyRingRotationHandler } from "../types";

/** The lifecycle of one app client and every client derived from it. */
export function createLifecycleHub(): LifecycleHub {
  const handlers = new Set<KeyRingRotationHandler>();
  const listeners = new Set<(event: KeyRingLifecycleEvent) => void>();
  // Closures, not `this`: the client hands these methods out detached.
  return {
    onKeyRotation(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(event) {
      for (const listener of listeners) listener(event);
    },
    rotationHandlers() {
      return [...handlers];
    },
  };
}

/** The public lifecycle plus what the adapters use to drive it. */
export interface LifecycleHub extends KeyRingLifecycle {
  /** Sends `event` to every subscriber. */
  emit(event: KeyRingLifecycleEvent): void;
  /** A snapshot of the registered rotation handlers, in registration order. */
  rotationHandlers(): readonly KeyRingRotationHandler[];
}
