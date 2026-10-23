import type { Store } from "redux";
import {
  countervaluesSyncErrorSelector,
  countervaluesSyncPendingSelector,
} from "@features/platform-market-countervalues";
import { logStartupEvent } from "./logStartupTime";

type CountervaluesRootState = Parameters<typeof countervaluesSyncPendingSelector>[0];

/**
 * Logs the end of the first countervalues load as a startup event, then stops listening. A
 * measurement must never break a dispatch, so any error also just stops the listening.
 */
export function logFirstCountervaluesLoad(
  store: Pick<Store<CountervaluesRootState>, "getState" | "subscribe">,
): void {
  let loading = false;
  const unsubscribe = store.subscribe(() => {
    try {
      const state = store.getState();
      if (countervaluesSyncPendingSelector(state)) {
        loading = true;
        return;
      }
      if (!loading) return;
      unsubscribe();
      logStartupEvent(
        countervaluesSyncErrorSelector(state)
          ? "Countervalues first load failed"
          : "Countervalues first load done",
      );
    } catch {
      unsubscribe();
    }
  });
}
