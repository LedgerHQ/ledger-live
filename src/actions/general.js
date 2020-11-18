// @flow
import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  nestedSortAccounts,
  flattenSortAccounts,
  sortAccountsComparatorFromOrder,
} from "@ledgerhq/live-common/lib/account";
import type { FlattenAccountsOptions } from "@ledgerhq/live-common/lib/account";
import {
  useDistribution as useDistributionCommon,
  useCalculateCountervalueCallback as useCalculateCountervalueCallbackCommon,
  useCountervaluesPolling,
} from "@ledgerhq/live-common/lib/countervalues/react";
import { inferTrackingPairForAccounts } from "@ledgerhq/live-common/lib/countervalues/logic";
import { pairId } from "@ledgerhq/live-common/lib/countervalues/helpers";
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

export function useNestedSortAccounts() {
  const accounts = useSelector(accountsSelector);
  const comparator = useSortAccountsComparator();

  return useMemo(() => nestedSortAccounts(accounts, comparator), [
    accounts,
    comparator,
  ]);
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
  const payload = useNestedSortAccounts();
  const dispatch = useDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // workaround for not reflecting the latest payload when calling refresh right after updating accounts
  useEffect(() => {
    if (!isRefreshing) {
      return;
    }
    dispatch({
      type: "SET_ACCOUNTS",
      payload,
    });
    setIsRefreshing(false);
  }, [isRefreshing, dispatch, payload]);

  return useCallback(() => {
    setIsRefreshing(true);
  }, []);
}

export function useRefreshAccountsOrderingEffect({
  onMount = false,
  onUnmount = false,
  onUpdate = false,
}: {
  onMount?: boolean,
  onUnmount?: boolean,
  onUpdate?: boolean,
}) {
  const refreshAccountsOrdering = useRefreshAccountsOrdering();

  const didMount = useRef(false);
  useEffect(() => {
    if (didMount.current) {
      if (onUpdate) {
        refreshAccountsOrdering();
      }
    } else {
      didMount.current = true;
    }

    if (onMount) {
      refreshAccountsOrdering();
    }

    return () => {
      if (onUnmount) {
        refreshAccountsOrdering();
      }
    };
  }, [onMount, onUnmount, onUpdate, refreshAccountsOrdering]);
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

export function useTrackingPairIds(): string[] {
  const trackingPairs = useTrackingPairs();
  return useMemo(() => trackingPairs.map(p => pairId(p)), [trackingPairs]);
}

export function useTrackingPairs() {
  const accounts = useSelector(accountsSelector);
  const countervalue = useSelector(counterValueCurrencySelector);
  return useMemo(() => inferTrackingPairForAccounts(accounts, countervalue), [
    accounts,
    countervalue,
  ]);
}
