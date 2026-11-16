import type { Store } from "redux";
import type { CounterValuesStateRaw } from "@domain/entity-market-countervalues";
import { selectAppAvailabilitySettled } from "@features/flow-app-availability";
import { startCountervaluesSync } from "@features/platform-market-countervalues";
import { selectRemoteFlagsReady, type WithFeatureFlags } from "@shared/feature-flags";
import { logStartupEvent } from "LLM/utils/logStartupTime";

/**
 * Starts the countervalues loop when the app is let through `WaitForAppReady`: currencies hydrated,
 * remote flags ready and the OFAC check settled, or after a second at most. The settings read the
 * flags and LiveConfig, so they are first computed once those are in place. Waiting for the OFAC
 * check keeps the loop's first response, handled on the JS thread before a later OFAC answer, from
 * holding the gate.
 *
 * @param store
 * The app store: read for the remote flags and the OFAC check, then dispatched the start to.
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
  return whenAppReady(store, currenciesHydrated).then(() => {
    logStartupEvent("Countervalues sync started");
    store.dispatch(startCountervaluesSync({ savedState }));
  });
}

/**
 * Resolves once the currencies are hydrated, the remote flags ready and the OFAC check settled, or
 * after `MAX_WAIT_MS`, whichever comes first. The one wait owns its timer and its store
 * subscription, and releases both as soon as it settles.
 *
 * @param store
 * The app store, read for the remote flags and the OFAC check.
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
      const state = store.getState();
      if (
        areCurrenciesHydrated &&
        selectRemoteFlagsReady(state) &&
        selectAppAvailabilitySettled(state)
      ) {
        settle();
      }
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
