import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { createSelector } from "reselect";
// TODO make a generic way to implement this for each family
import { FlattenAccountsOptions } from "@ledgerhq/live-common/account/index";
import { isAccountDelegating } from "@ledgerhq/live-common/families/tezos/staking";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import {
  useCalculateCountervalueCallback as useCalculateCountervalueCallbackCommon,
  useTrackingPairForAccounts,
} from "@ledgerhq/live-countervalues-react";
import { useDistribution as useDistributionRaw } from "@ledgerhq/live-countervalues-react/portfolio";
import { resolveTrackingPairs } from "@ledgerhq/live-countervalues/logic";
import {
  flattenSortAccounts,
  sortAccountsComparatorFromOrder,
} from "@ledgerhq/live-wallet/ordering";
import { reorderAccounts } from "~/renderer/actions/accounts";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { osDarkModeSelector } from "~/renderer/reducers/application";
import {
  counterValueCurrencySelector,
  getOrderAccounts,
  selectedTimeRangeSelector,
  userThemeSelector,
} from "~/renderer/reducers/settings";
import { walletSelector } from "../reducers/wallet";
import { countervaluesActions } from "./countervalues";
import { useExtraSessionTrackingPair } from "./deprecated/ondemand-countervalues";

export function useDistribution(
  opts: Omit<Parameters<typeof useDistributionRaw>[0], "accounts" | "to">,
) {
  const accounts = useSelector(accountsSelector);
  const to = useSelector(counterValueCurrencySelector);
  return useDistributionRaw({
    accounts,
    to,
    ...opts,
  });
}
export function useCalculateCountervalueCallback() {
  const to = useSelector(counterValueCurrencySelector);
  return useCalculateCountervalueCallbackCommon({
    to,
  });
}
export function useSortAccountsComparator() {
  const orderAccounts = useSelector(getOrderAccounts);
  const calc = useCalculateCountervalueCallback();
  const walletState = useSelector(walletSelector);
  return sortAccountsComparatorFromOrder(orderAccounts, walletState, calc);
}
export function useFlattenSortAccounts(options?: FlattenAccountsOptions) {
  const accounts = useSelector(accountsSelector);
  const comparator = useSortAccountsComparator();
  return useMemo(
    () => flattenSortAccounts(accounts, comparator, options),
    [accounts, comparator, options],
  );
}
export const delegatableAccountsSelector = createSelector(accountsSelector, accounts =>
  accounts.filter(acc => acc.currency.family === "tezos" && !isAccountDelegating(acc)),
);
export function useRefreshAccountsOrdering() {
  const comparator = useSortAccountsComparator();
  const dispatch = useDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // workaround for not reflecting the latest payload when calling refresh right after updating accounts
  useEffect(() => {
    if (!isRefreshing) {
      return;
    }
    dispatch(reorderAccounts(comparator));
    setIsRefreshing(false);
  }, [isRefreshing, dispatch, comparator]);
  return useCallback(() => {
    setIsRefreshing(true);
  }, []);
}
export function useRefreshAccountsOrderingEffect({
  onMount = false,
  onUnmount = false,
}: {
  onMount?: boolean;
  onUnmount?: boolean;
}) {
  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useEffect(() => {
    if (onMount) {
      refreshAccountsOrdering();
    }
    return () => {
      if (onUnmount) {
        refreshAccountsOrdering();
      }
    };
  }, [onMount, onUnmount, refreshAccountsOrdering]);
}
export const themeSelector = createSelector(
  osDarkModeSelector,
  userThemeSelector,
  (osDark, theme) => theme || (osDark ? "dark" : "light"),
);

export function useCalculateCountervaluesUserSettings() {
  const dispatch = useDispatch();
  const countervalue = useSelector(counterValueCurrencySelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);

  // countervalues for accounts
  const accounts = useSelector(accountsSelector);
  const trPairs = useTrackingPairForAccounts(accounts, countervalue);

  // countervalues for on demand session tracking pairs
  const extraSessionTrackingPairs = useExtraSessionTrackingPair();

  const granularitiesRatesConfig = useFeature("llCounterValueGranularitiesRates");

  useEffect(() => {
    const trackingPairs = resolveTrackingPairs(extraSessionTrackingPairs.concat(trPairs));

    const granularitiesRates = granularitiesRatesConfig?.enabled
      ? {
          daily: Number(granularitiesRatesConfig.params?.daily),
          hourly: Number(granularitiesRatesConfig.params?.hourly),
        }
      : undefined;

    dispatch(
      countervaluesActions.COUNTERVALUES_USER_SETTINGS_SET({
        trackingPairs,
        autofillGaps: true,
        refreshRate: LiveConfig.getValueByKey("config_countervalues_refreshRate"),
        marketCapBatchingAfterRank: LiveConfig.getValueByKey(
          "config_countervalues_marketCapBatchingAfterRank",
        ),
        granularitiesRates,
        selectedTimeRange,
      }),
    );
  }, [dispatch, granularitiesRatesConfig, extraSessionTrackingPairs, trPairs, selectedTimeRange]);
}
