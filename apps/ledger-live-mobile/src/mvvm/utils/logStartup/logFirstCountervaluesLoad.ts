import type { Store } from "redux";
import {
  countervaluesSyncErrorSelector,
  countervaluesSyncPendingSelector,
} from "@features/platform-market-countervalues";
import { logStartupEvent } from "../logStartupTime";

type CountervaluesRootState = Parameters<typeof countervaluesSyncPendingSelector>[0];

/** A first load that has not ended by then is no longer part of the startup. */
export const FIRST_LOAD_LISTEN_MS = 60_000;

/**
 * Logs the end of the first countervalues load as a startup event, then stops listening. It also
 * stops after FIRST_LOAD_LISTEN_MS, so a session where no load starts keeps no listener. A
 * measurement must never break a dispatch, so any error also just stops the listening.
 */
export function logFirstCountervaluesLoad(
  store: Pick<Store<CountervaluesRootState>, "getState" | "subscribe">,
): void {
  let loading = false;
  let unsubscribe: (() => void) | undefined;
  const timeLimit = setTimeout(() => unsubscribe?.(), FIRST_LOAD_LISTEN_MS);
  const stopListening = () => {
    clearTimeout(timeLimit);
    unsubscribe?.();
  };
  unsubscribe = store.subscribe(() => {
    try {
      const state = store.getState();
      if (countervaluesSyncPendingSelector(state)) {
        loading = true;
        return;
      }
      if (!loading) return;
      stopListening();
      logStartupEvent(
        countervaluesSyncErrorSelector(state)
          ? "Countervalues first load failed"
          : "Countervalues first load done",
      );
    } catch {
      stopListening();
    }
  });
}
