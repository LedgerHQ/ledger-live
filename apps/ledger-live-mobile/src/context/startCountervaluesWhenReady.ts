import type { Store } from "redux";
import type { CounterValuesStateRaw } from "@domain/entity-market-countervalues";
import { startCountervaluesSync } from "@features/platform-market-countervalues";
import { selectRemoteFlagsReady, type WithFeatureFlags } from "@shared/feature-flags";
import { logStartupEvent } from "LLM/utils/logStartupTime";

/**
 * Starts the countervalues loop when the app is let through `WaitForAppReady`: currencies hydrated
 * and remote flags ready, or after a second at most. The settings read the flags and LiveConfig, so
 * they are first computed once those are in place. The OFAC check that gate also waits on plays no
 * part in countervalues.
 *
 * @param store
 * The app store: read for the remote flags, then dispatched the start to.
 * @param savedState
 * The countervalues restored from disk, handed to the loop's first start.
 * @param currenciesHydrated
 * Settles once the currencies are hydrated. A rejection counts as settled.
 */
export function startCountervaluesWhenReady(
  store: Pick<Store<WithFeatureFlags>, "dispatch" | "getState" | "subscribe">,
  savedState: CounterValuesStateRaw | undefined,
  currenciesHydrated: Promise<unknown>,
): Promise<void> {
  return Promise.all([whenAppReady(store, currenciesHydrated), whenAppLetThrough()]).then(() => {
    logStartupEvent("Countervalues sync started");
    store.dispatch(startCountervaluesSync({ savedState }));
  });
}

let letAppThrough: () => void = () => {};
const appLetThrough = new Promise<void>(resolve => {
  letAppThrough = resolve;
});

/** Called by `WaitForAppReady` once it lets the app through. */
export function markAppLetThrough(): void {
  letAppThrough();
}

// Experiment: start the countervalues loop only once `WaitForAppReady` has let the app through,
// so its first work does not land during startup. The timeout keeps the loop from never starting.
function whenAppLetThrough(): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, LET_THROUGH_MAX_WAIT_MS);
    void appLetThrough.then(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}

const LET_THROUGH_MAX_WAIT_MS = 3_000;

/**
 * Resolves once the currencies are hydrated and the remote flags ready, or after `MAX_WAIT_MS`,
 * whichever comes first. The one wait owns its timer and its store subscription, and releases both
 * as soon as it settles.
 *
 * @param store
 * The app store, read for the remote flags.
 * @param currenciesHydrated
 * Settles once the currencies are hydrated. A rejection counts as settled.
 */
function whenAppReady(
  store: Pick<Store<WithFeatureFlags>, "getState" | "subscribe">,
  currenciesHydrated: Promise<unknown>,
): Promise<void> {
  return new Promise(resolve => {
    let areCurrenciesHydrated = false;
    // Safe to call twice: the timer, the subscription and the promise all ignore a second release.
    const settle = () => {
      clearTimeout(timer);
      unsubscribe();
      resolve();
    };
    const check = () => {
      if (areCurrenciesHydrated && selectRemoteFlagsReady(store.getState())) settle();
    };
    const onCurrenciesHydrated = () => {
      areCurrenciesHydrated = true;
      check();
    };

    const timer = setTimeout(settle, MAX_WAIT_MS);
    // Subscribed before the first check so a settle can never slip through the gap between them.
    const unsubscribe = store.subscribe(check);
    // A failed hydration still lets the app through, as `currencyInitialized` is set either way.
    currenciesHydrated.then(onCurrenciesHydrated, onCurrenciesHydrated);
  });
}

// The app's own readiness gate (`WaitForAppReady`) caps its wait at this.
const MAX_WAIT_MS = 1_000;
