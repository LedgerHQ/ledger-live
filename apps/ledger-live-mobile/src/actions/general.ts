import { useMemo, useCallback, useEffect, useState } from "react";
import { InteractionManager } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import {
  flattenSortAccounts,
  sortAccountsComparatorFromOrder,
  type AccountComparator,
} from "@ledgerhq/live-common/account/ordering";
import type { FlattenAccountsOptions } from "@ledgerhq/live-common/account/index";
import type { TrackingPair } from "@ledgerhq/live-countervalues/types";
import {
  useCalculateCountervalueCallback as useCalculateCountervalueCallbackCommon,
  useCountervaluesState,
  useTrackingPairForAccounts,
} from "@ledgerhq/live-countervalues-react";
import { useDistribution as useLegacyDistribution } from "@ledgerhq/live-countervalues-react/portfolio";
import {
  useAssetDistribution,
  type DistributionOpts,
  type DistributionResult,
} from "@ledgerhq/live-common/portfolio/useAssetDistribution";
import VersionNumber from "react-native-version-number";
import { BehaviorSubject } from "rxjs";
import { replaceAccounts, reorderAccounts } from "./accounts";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { accountsSelector } from "../reducers/accounts";
import {
  blacklistedTokenIdsSelector,
  counterValueCurrencySelector,
  orderAccountsSelector,
} from "../reducers/settings";
import { clearBridgeCache } from "../bridge/cache";
import { flushAll } from "../components/DBSave";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { walletSelector } from "~/reducers/wallet";
import { useFeature } from "@features/platform-feature-flags";
import { isAccountWorkletEnabled } from "LLM/utils/perfOptimizationMode";
import {
  rankAccountSnapshotsOffJs,
  snapshotAccountsForRanking,
} from "LLM/utils/rankAccountsWorklet";
import { useWorkletAssetsDistribution } from "LLM/hooks/useWorkletRankedAccounts";

const extraSessionTrackingPairsChanges: BehaviorSubject<TrackingPair[]> = new BehaviorSubject<
  TrackingPair[]
>([]);

function comparatorFromRankedIds(ids: string[]): AccountComparator {
  const order = new Map<string, number>();
  for (let i = 0; i < ids.length; i++) {
    order.set(ids[i], i);
  }
  return (a, b) =>
    (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER);
}

export function useDistribution(opts: DistributionOpts = {}): DistributionResult {
  const accounts = useSelector(accountsSelector);
  const to = useSelector(counterValueCurrencySelector);
  const { groupBy, ...displayOpts } = opts;
  const isAssetMode = groupBy === "asset";
  const workletEnabled = isAccountWorkletEnabled();

  const legacy = useLegacyDistribution({
    accounts,
    to,
    skip: isAssetMode || workletEnabled,
    ...displayOpts,
  });
  const asset = useAssetDistribution({
    accounts,
    to,
    product: "llm",
    version: VersionNumber.appVersion ?? "",
    skip: !isAssetMode,
    ...displayOpts,
  });
  const worklet = useWorkletAssetsDistribution({
    ...displayOpts,
    skip: isAssetMode || !workletEnabled,
  });

  if (isAssetMode) {
    return { ...asset.distribution, isLoading: asset.isLoading };
  }
  if (workletEnabled) {
    return worklet;
  }
  return { ...legacy, isLoading: false };
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
  const walletState = useSelector(walletSelector);
  return sortAccountsComparatorFromOrder(accounts, walletState.accountNames, calc);
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
  const accounts = useSelector(accountsSelector);
  const excludedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const countervalueState = useCountervaluesState();
  const toCurrency = useSelector(counterValueCurrencySelector);
  const orderAccounts = useSelector(orderAccountsSelector);
  const comparator = useSortAccountsComparator();
  const dispatch = useDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);
  useEffect(() => {
    if (!isRefreshing) {
      return;
    }

    const rankOnWorklet = isAccountWorkletEnabled() && orderAccounts.startsWith("balance");
    if (!rankOnWorklet) {
      dispatch(reorderAccounts(comparator));
      setIsRefreshing(false);
      return;
    }

    const snapshots = snapshotAccountsForRanking(accounts, countervalueState, toCurrency, true);
    let cancelled = false;
    rankAccountSnapshotsOffJs({ snapshots, excludedTokenIds }).then(result => {
      if (cancelled) {
        return;
      }
      dispatch(reorderAccounts(comparatorFromRankedIds(result.ids)));
      setIsRefreshing(false);
    });
    return () => {
      cancelled = true;
    };
  }, [
    accounts,
    comparator,
    countervalueState,
    dispatch,
    excludedTokenIds,
    isRefreshing,
    orderAccounts,
    toCurrency,
  ]);
  return useCallback(() => {
    setIsRefreshing(true);
  }, []);
}
export function useRefreshAccountsOrderingAfterInteractions() {
  const refreshAccountsOrdering = useRefreshAccountsOrdering();

  return useCallback(() => {
    const interactionTask = InteractionManager.runAfterInteractions(refreshAccountsOrdering);

    return () => {
      interactionTask.cancel();
    };
  }, [refreshAccountsOrdering]);
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
  const accounts = useSelector(accountsSelector);
  return useCallback(async () => {
    const cleared = await Promise.all(
      accounts.map(async account => {
        const bridge = await getAccountBridge(account);
        return bridge.clearAccount(account);
      }),
    );
    dispatch(replaceAccounts(cleared));

    await clearBridgeCache();
    flushAll();
  }, [dispatch, accounts]);
}

export function useUserSettings() {
  const trackingPairs = useTrackingPairs();

  const granularitiesRatesConfig = useFeature("llCounterValueGranularitiesRates");
  const granularitiesRates = useMemo(
    () =>
      granularitiesRatesConfig?.enabled
        ? {
            daily: Number(granularitiesRatesConfig.params?.daily),
            hourly: Number(granularitiesRatesConfig.params?.hourly),
          }
        : undefined,
    [granularitiesRatesConfig],
  );

  return useMemo(
    () => ({
      trackingPairs,
      autofillGaps: true,
      refreshRate: LiveConfig.getValueByKey("config_countervalues_refreshRate"),
      marketCapBatchingAfterRank: LiveConfig.getValueByKey(
        "config_countervalues_marketCapBatchingAfterRank",
      ),
      granularitiesRates,
    }),
    [granularitiesRates, trackingPairs],
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
