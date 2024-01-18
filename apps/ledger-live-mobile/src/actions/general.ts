import { useMemo, useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  flattenSortAccounts,
  sortAccountsComparatorFromOrder,
} from "@ledgerhq/live-common/account/index";
import type { FlattenAccountsOptions } from "@ledgerhq/live-common/account/index";
import type { TrackingPair } from "@ledgerhq/live-countervalues/types";
import {
  useCalculateCountervalueCallback as useCalculateCountervalueCallbackCommon,
  useCountervaluesPolling,
  useTrackingPairForAccounts,
} from "@ledgerhq/live-countervalues-react";
import { useDistribution as useDistributionCommon } from "@ledgerhq/live-common/portfolio/v2/react";
import { BehaviorSubject } from "rxjs";
import { cleanCache, reorderAccounts } from "./accounts";
import { accountsSelector } from "../reducers/accounts";
import { counterValueCurrencySelector, orderAccountsSelector } from "../reducers/settings";
import { clearBridgeCache } from "../bridge/cache";
import { flushAll } from "../components/DBSave";

const extraSessionTrackingPairsChanges: BehaviorSubject<TrackingPair[]> = new BehaviorSubject<
  TrackingPair[]
>([]);
export function useDistribution(
  opts: Omit<Parameters<typeof useDistributionCommon>[0], "accounts" | "to">,
) {
  const accounts = useSelector(accountsSelector);
  const to = useSelector(counterValueCurrencySelector);
  return useDistributionCommon({ accounts, to, ...opts });
}
export function useCalculateCountervalueCallback() {
  const to = useSelector(counterValueCurrencySelector);
  return useCalculateCountervalueCallbackCommon({
    to,
  });
}
export function useSortAccountsComparator() {
  const accounts = useSelector(orderAccountsSelector);
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
export function useCleanCache() {
  const dispatch = useDispatch();
  const { wipe } = useCountervaluesPolling();
  return useCallback(async () => {
    dispatch(cleanCache());

    await clearBridgeCache();
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
export function addExtraSessionTrackingPair(trackingPair: TrackingPair) {
  const value = extraSessionTrackingPairsChanges.value;
  if (!value.some(tp => tp.from === trackingPair.from && tp.to === trackingPair.to))
    extraSessionTrackingPairsChanges.next(value.concat(trackingPair));
}
export function useExtraSessionTrackingPair() {
  const [extraSessionTrackingPair, setExtraSessionTrackingPair] = useState<TrackingPair[]>([]);
  useEffect(() => {
    const sub = extraSessionTrackingPairsChanges.subscribe(setExtraSessionTrackingPair);
    return () => sub && sub.unsubscribe();
  }, []);
  return extraSessionTrackingPair;
}
export function useTrackingPairs(): TrackingPair[] {
  const accounts = useSelector(accountsSelector);
  const countervalue = useSelector(counterValueCurrencySelector);
  const trPairs = useTrackingPairForAccounts(accounts, countervalue);
  const extraSessionTrackingPairs = useExtraSessionTrackingPair();
  return useMemo(
    () => extraSessionTrackingPairs.concat(trPairs),
    [extraSessionTrackingPairs, trPairs],
  );
}
