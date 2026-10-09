import type { Store } from "redux";
import type { CounterValuesStateRaw } from "@domain/entity-market-countervalues";
import { startCountervaluesSync } from "@features/platform-market-countervalues";
import { selectRemoteFlagsReady, type WithFeatureFlags } from "@shared/feature-flags";

// The app's own readiness gate (`WaitForAppReady`) caps its wait at this.
const MAX_WAIT_MS = 1_000;

function whenRemoteFlagsReady(
  store: Pick<Store<WithFeatureFlags>, "getState" | "subscribe">,
): Promise<void> {
  return new Promise(resolve => {
    let unsubscribe: (() => void) | undefined;
    const check = () => {
      if (!selectRemoteFlagsReady(store.getState())) return;
      unsubscribe?.();
      resolve();
    };
    // Subscribed before the first check so a settle can never slip through the gap between them.
    unsubscribe = store.subscribe(check);
    check();
  });
}

/**
 * Starts the countervalues loop when the app is let through `WaitForAppReady`: currencies hydrated
 * and remote flags ready, or after a second at most. The settings read the flags and LiveConfig, so
 * they are first computed once those are in place. The OFAC check that gate also waits on plays no
 * part in countervalues.
 */
export function startCountervaluesWhenReady(
  store: Pick<Store<WithFeatureFlags>, "dispatch" | "getState" | "subscribe">,
  savedState: CounterValuesStateRaw | undefined,
  currenciesHydrated: Promise<unknown>,
): Promise<void> {
  // A failed hydration still lets the app through, as `currencyInitialized` is set either way.
  const settled = currenciesHydrated.then(
    () => {},
    () => {},
  );
  const ready = Promise.all([settled, whenRemoteFlagsReady(store)]);
  const timeout = new Promise(resolve => setTimeout(resolve, MAX_WAIT_MS));
  return Promise.race([ready, timeout]).then(() => {
    store.dispatch(startCountervaluesSync({ savedState }));
  });
}
