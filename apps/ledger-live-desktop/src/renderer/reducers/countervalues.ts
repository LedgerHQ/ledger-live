import { createSelector } from "reselect";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { inferTrackingPairForAccounts } from "@ledgerhq/live-common/portfolio/trackingPairs";
import {
  resolveTrackingPairs,
  type CountervaluesSettings,
} from "@domain/entity-market-countervalues";
import {
  countervaluesStateSelector,
  haveSameTrackingPairs,
} from "@features/platform-market-countervalues";
import { selectFeature } from "@shared/feature-flags";
import { useSelector } from "LLD/hooks/redux";
import type { State } from ".";
import { accountsSelector } from "./accounts";
import { selectExtraTrackingPairs } from "./countervaluesExtraTracking";
import { counterValueCurrencySelector } from "./settings";

export const useCountervaluesState = () => useSelector(countervaluesStateSelector);

function granularitiesRatesFlagSelector(state: State) {
  return selectFeature(state, "llCounterValueGranularitiesRates");
}

/**
 * Creates the countervalues settings selector: a new object only when an input changes, since each
 * one reloads. The countervalues loop creates one per start, so its memo starts fresh.
 */
export function createCountervaluesSettingsSelector() {
  // The same pairs while accounts resynchronize without changing them.
  const accountsTrackingPairsSelector = createSelector(
    [accountsSelector, counterValueCurrencySelector],
    (accounts, countervalue) => inferTrackingPairForAccounts(accounts, countervalue),
    { memoizeOptions: { resultEqualityCheck: haveSameTrackingPairs } },
  );

  return createSelector(
    [accountsTrackingPairsSelector, selectExtraTrackingPairs, granularitiesRatesFlagSelector],
    (
      accountsTrackingPairs,
      extraTrackingPairs,
      granularitiesRatesConfig,
    ): CountervaluesSettings => {
      const trackingPairs = resolveTrackingPairs(extraTrackingPairs.concat(accountsTrackingPairs));

      const granularitiesRates = granularitiesRatesConfig?.enabled
        ? {
            daily: Number(granularitiesRatesConfig.params?.daily),
            hourly: Number(granularitiesRatesConfig.params?.hourly),
          }
        : undefined;

      return {
        trackingPairs,
        autofillGaps: true,
        refreshRate: LiveConfig.getValueByKey("config_countervalues_refreshRate"),
        marketCapBatchingAfterRank: LiveConfig.getValueByKey(
          "config_countervalues_marketCapBatchingAfterRank",
        ),
        granularitiesRates,
      };
    },
  );
}
