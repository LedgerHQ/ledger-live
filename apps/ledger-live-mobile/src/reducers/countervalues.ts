import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { inferTrackingPairForAccounts } from "@ledgerhq/live-common/portfolio/trackingPairs";
import type { CountervaluesSettings } from "@domain/entity-market-countervalues";
import {
  countervaluesStateSelector,
  haveSameTrackingPairs,
} from "@features/platform-market-countervalues";
import { selectFeature } from "@shared/feature-flags";
import { createSelector } from "~/context/selectors";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "./accounts";
import { extraSessionTrackingPairsSelector } from "./countervaluesExtraSessionTracking";
import { counterValueCurrencySelector } from "./settings";
import type { State } from "./types";

export const useCountervaluesState = () => useSelector(countervaluesStateSelector);

function createTrackingPairsSelector() {
  // The same pairs while accounts resynchronize without changing them.
  const accountsTrackingPairsSelector = createSelector(
    [accountsSelector, counterValueCurrencySelector],
    (accounts, countervalue) => inferTrackingPairForAccounts(accounts, countervalue),
    { memoizeOptions: { resultEqualityCheck: haveSameTrackingPairs } },
  );

  return createSelector(
    [extraSessionTrackingPairsSelector, accountsTrackingPairsSelector],
    (extraSessionTrackingPairs, accountsTrackingPairs) =>
      extraSessionTrackingPairs.concat(accountsTrackingPairs),
  );
}

/** The pairs to track: the session's extra pairs, then the accounts' own. */
export const trackingPairsSelector = createTrackingPairsSelector();

function granularitiesRatesFlagSelector(state: State) {
  return selectFeature(state, "llCounterValueGranularitiesRates");
}

/**
 * Creates the countervalues settings selector: a new object only when an input changes, since each
 * one reloads. The countervalues loop creates one per start, so its memo starts fresh.
 */
export function createCountervaluesSettingsSelector() {
  const granularitiesRatesSelector = createSelector(
    [granularitiesRatesFlagSelector],
    granularitiesRatesConfig =>
      granularitiesRatesConfig?.enabled
        ? {
            daily: Number(granularitiesRatesConfig.params?.daily),
            hourly: Number(granularitiesRatesConfig.params?.hourly),
          }
        : undefined,
  );

  return createSelector(
    [granularitiesRatesSelector, createTrackingPairsSelector()],
    (granularitiesRates, trackingPairs): CountervaluesSettings => ({
      trackingPairs,
      autofillGaps: true,
      refreshRate: LiveConfig.getValueByKey("config_countervalues_refreshRate"),
      marketCapBatchingAfterRank: LiveConfig.getValueByKey(
        "config_countervalues_marketCapBatchingAfterRank",
      ),
      granularitiesRates,
    }),
  );
}
