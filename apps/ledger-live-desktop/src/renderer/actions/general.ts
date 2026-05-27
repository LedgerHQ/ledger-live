import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { createSelector } from "reselect";
import type { FlattenAccountsOptions } from "@ledgerhq/live-common/account/index";
import { isAccountDelegating } from "@ledgerhq/live-common/families/tezos/staking";
import { useFeature } from "@features/platform-feature-flags";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import {
  useCalculateCountervalueCallback as useCalculateCountervalueCallbackCommon,
  useTrackingPairForAccounts,
} from "@ledgerhq/live-countervalues-react";
import { resolveTrackingPairs } from "@ledgerhq/live-countervalues/logic";
import {
  flattenSortAccounts,
  sortAccountsComparatorFromOrder,
} from "@ledgerhq/live-wallet/ordering";
import { useDistribution as useLegacyDistribution } from "@ledgerhq/live-countervalues-react/portfolio";
import {
  useAssetDistribution,
  type DistributionOpts,
  type DistributionResult,
} from "@ledgerhq/live-common/portfolio/useAssetDistribution";
import { reorderAccounts } from "~/renderer/actions/accounts";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { osDarkModeSelector } from "~/renderer/reducers/application";
import {
  counterValueCurrencySelector,
  getOrderAccounts,
  userThemeSelector,
} from "~/renderer/reducers/settings";
import { walletSelector } from "../reducers/wallet";
import { countervaluesActions } from "./countervalues";
import { selectExtraTrackingPairs } from "~/renderer/reducers/countervaluesExtraTracking";

export function useDistribution(opts: DistributionOpts = {}): DistributionResult {
  const accounts = useSelector(accountsSelector);
  const to = useSelector(counterValueCurrencySelector);
  const { groupBy, ...displayOpts } = opts;
  const isAssetMode = groupBy === "asset";

  const legacy = useLegacyDistribution({ accounts, to, skip: isAssetMode, ...displayOpts });
  const asset = useAssetDistribution({
    accounts,
    to,
    product: "lld",
    version: __APP_VERSION__,
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

  // countervalues for accounts
  const accounts = useSelector(accountsSelector);
  const trPairs = useTrackingPairForAccounts(accounts, countervalue);

  // countervalues for on demand session tracking pairs
  const extraSessionTrackingPairs = useSelector(selectExtraTrackingPairs);

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
      }),
    );
  }, [dispatch, granularitiesRatesConfig, extraSessionTrackingPairs, trPairs]);
}
