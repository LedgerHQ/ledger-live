import { useMemo, useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
// TODO make a generic way to implement this for each family
// eslint-disable-next-line no-restricted-imports
import { isAccountDelegating } from "@ledgerhq/live-common/families/tezos/bakers";
import {
  flattenSortAccounts,
  sortAccountsComparatorFromOrder,
  FlattenAccountsOptions,
} from "@ledgerhq/live-common/account/index";
import { reorderAccounts } from "~/renderer/actions/accounts";
import {
  useCalculateCountervalueCallback as useCalculateCountervalueCallbackCommon,
  useTrackingPairForAccounts,
} from "@ledgerhq/live-countervalues-react";
import { CountervaluesSettings } from "@ledgerhq/live-countervalues/types";
import { useDistribution as useDistributionRaw } from "@ledgerhq/live-countervalues-react/portfolio";
import { accountsSelector, activeAccountsSelector } from "~/renderer/reducers/accounts";
import { osDarkModeSelector } from "~/renderer/reducers/application";
import {
  getOrderAccounts,
  counterValueCurrencySelector,
  userThemeSelector,
} from "~/renderer/reducers/settings";
import { resolveTrackingPairs } from "@ledgerhq/live-countervalues/logic";
import { useExtraSessionTrackingPair } from "./deprecated/ondemand-countervalues";
import { useMarketPerformanceTrackingPairs } from "./marketperformance";

// provide redux states via custom hook wrapper

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
  const accounts = useSelector(getOrderAccounts);
  const calc = useCalculateCountervalueCallback();
  return sortAccountsComparatorFromOrder(accounts, calc);
}
export function useFlattenSortAccounts(options?: FlattenAccountsOptions) {
  const accounts = useSelector(accountsSelector);
  const comparator = useSortAccountsComparator();
  return useMemo(
    () => flattenSortAccounts(accounts, comparator, options),
    [accounts, comparator, options],
  );
}
export const delegatableAccountsSelector = createSelector(activeAccountsSelector, accounts =>
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

export function useCalculateCountervaluesUserSettings(): CountervaluesSettings {
  const countervalue = useSelector(counterValueCurrencySelector);

  // countervalues for top coins (market performance feature)
  const trackingPairsForTopCoins = useMarketPerformanceTrackingPairs(countervalue);

  // countervalues for accounts
  const accounts = useSelector(accountsSelector);
  const trPairs = useTrackingPairForAccounts(accounts, countervalue);

  // countervalues for on demand session tracking pairs
  const extraSessionTrackingPairs = useExtraSessionTrackingPair();

  // we merge all usecases that require tracking pairs
  const trackingPairs = useMemo(
    () =>
      resolveTrackingPairs(
        extraSessionTrackingPairs.concat(trPairs).concat(trackingPairsForTopCoins),
      ),
    [extraSessionTrackingPairs, trackingPairsForTopCoins, trPairs],
  );

  return useMemo(
    () => ({
      trackingPairs,
      autofillGaps: true,
    }),
    [trackingPairs],
  );
}
