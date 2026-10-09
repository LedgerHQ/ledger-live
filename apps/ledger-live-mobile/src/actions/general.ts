import { useMemo, useCallback, useEffect, useState } from "react";
import { InteractionManager } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import {
  flattenSortAccounts,
  sortAccountsComparatorFromOrder,
} from "@ledgerhq/live-common/account/ordering";
import type { FlattenAccountsOptions } from "@ledgerhq/live-common/account/index";
import type { TrackingPair } from "@domain/entity-market-countervalues";
import { useCalculateCountervalueCallback as useCalculateCountervalueCallbackCommon } from "@features/platform-market-countervalues";
import { useDistribution as useLegacyDistribution } from "@ledgerhq/live-common/portfolio/portfolioReact";
import {
  useAssetDistribution,
  type DistributionOpts,
  type DistributionResult,
} from "@ledgerhq/live-common/portfolio/useAssetDistribution";
import { appVersion } from "LLM/utils/appVersion";
import { replaceAccounts, reorderAccounts } from "./accounts";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { accountsSelector } from "../reducers/accounts";
import { counterValueCurrencySelector, orderAccountsSelector } from "../reducers/settings";
import { clearBridgeCache } from "../bridge/cache";
import { flushAll } from "../components/DBSave";
import { walletSelector } from "~/reducers/wallet";
import { trackingPairsSelector } from "~/reducers/countervalues";
import { extraSessionTrackingPairsSelector } from "~/reducers/countervaluesExtraSessionTracking";

export function useDistribution(opts: DistributionOpts = {}): DistributionResult {
  const accounts = useSelector(accountsSelector);
  const to = useSelector(counterValueCurrencySelector);
  const { groupBy, ...displayOpts } = opts;
  const isAssetMode = groupBy === "asset";

  const legacy = useLegacyDistribution({ accounts, to, skip: isAssetMode, ...displayOpts });
  const asset = useAssetDistribution({
    accounts,
    to,
    product: "llm",
    version: appVersion,
    skip: !isAssetMode,
    ...displayOpts,
  });

  if (isAssetMode) {
    return { ...asset.distribution, isLoading: asset.isLoading };
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

export function useExtraSessionTrackingPair() {
  return useSelector(extraSessionTrackingPairsSelector);
}

export function useTrackingPairs(): TrackingPair[] {
  return useSelector(trackingPairsSelector);
}
