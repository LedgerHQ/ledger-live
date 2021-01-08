// @flow
import { useMemo, useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  flattenSortAccounts,
  sortAccountsComparatorFromOrder,
} from "@ledgerhq/live-common/lib/account";
import type { FlattenAccountsOptions } from "@ledgerhq/live-common/lib/account";
import {
  useDistribution as useDistributionCommon,
  useCalculateCountervalueCallback as useCalculateCountervalueCallbackCommon,
  useCountervaluesPolling,
  useTrackingPairForAccounts,
} from "@ledgerhq/live-common/lib/countervalues/react";
import { reorderAccounts } from "./accounts";
import { accountsSelector } from "../reducers/accounts";
import {
  counterValueCurrencySelector,
  orderAccountsSelector,
} from "../reducers/settings";
import { clearBridgeCache } from "../bridge/cache";
import clearLibcore from "../helpers/clearLibcore";
import { flushAll } from "../components/DBSave";

export function useDistribution() {
  const accounts = useSelector(accountsSelector);
  const to = useSelector(counterValueCurrencySelector);
  return useDistributionCommon({ accounts, to });
}

export function useCalculateCountervalueCallback() {
  const to = useSelector(counterValueCurrencySelector);
  return useCalculateCountervalueCallbackCommon({ to });
}

export function useSortAccountsComparator() {
  const accounts = useSelector(orderAccountsSelector);
  const calc = useCalculateCountervalueCallback();

  return sortAccountsComparatorFromOrder(accounts, calc);
}

export function useFlattenSortAccounts(options?: FlattenAccountsOptions) {
  const accounts = useSelector(accountsSelector);
  const comparator = useSortAccountsComparator();
  return useMemo(() => flattenSortAccounts(accounts, comparator, options), [
    accounts,
    comparator,
    options,
  ]);
}

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
  onMount?: boolean,
  onUnmount?: boolean,
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

export function useCleanCache() {
  const dispatch = useDispatch();
  const { wipe } = useCountervaluesPolling();

  return useCallback(async () => {
    dispatch({ type: "CLEAN_CACHE" });
    dispatch({ type: "LEDGER_CV:WIPE" });
    await clearBridgeCache();
    await clearLibcore();
    wipe();
    flushAll();
  }, [dispatch, wipe]);
}

export function useUserSettings() {
  const trackingPairs = useTrackingPairs();
  return useMemo(
    () => ({
      trackingPairs,
      autofillGaps: true,
    }),
    [trackingPairs],
  );
}

export function useTrackingPairs() {
  const accounts = useSelector(accountsSelector);
  const countervalue = useSelector(counterValueCurrencySelector);
  return useTrackingPairForAccounts(accounts, countervalue);
}
