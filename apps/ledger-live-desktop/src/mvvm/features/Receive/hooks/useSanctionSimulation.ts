import { useMemo, useSyncExternalStore } from "react";

let isSimulated = false;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => isSimulated;

const setSimulated = (next: boolean) => {
  isSimulated = next;
  for (const listener of listeners) listener();
};

/**
 * The DevTools switch that makes the receive screen treat every address as sanctioned, to show
 * its blocked state. Held for the session only.
 */
export function useSanctionSimulation() {
  const simulated = useSyncExternalStore(subscribe, getSnapshot);
  return useMemo(() => ({ isSimulated: simulated, setSimulated }), [simulated]);
}
