import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { useNetInfo } from "@react-native-community/netinfo";
import { accountsWithUpToDateCheckSelector, hasNoAccountsSelector } from "~/reducers/accounts";
import { useBatchMaybeAccountName } from "~/reducers/wallet";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  useAccountsSyncStatus,
  useSyncLifecycle,
  useManualRefresh,
  type SyncPhase,
} from "@ledgerhq/live-common/bridge/react/index";
import {
  selectLastUserSyncClickTimestamp,
  selectHasCompletedInitialSync,
  setHasCompletedInitialSync,
  setLastUserSyncClickTimestamp,
} from "~/reducers/portfolioRefresh";
import { track } from "~/analytics";
import { useSyncSources } from "./useSyncSources";
import { usePortfolioAllAccounts } from "~/hooks/portfolio";

const DEFAULT_RANGE = "day" as const;

/**
 * Single source of truth for portfolio balance and the sync lifecycle.
 *
 * Mobile equivalent of desktop's usePortfolioBalance.
 * Consumed independently by the TopBar (useSyncIndicator), the Balance section,
 * and the PortfolioRefreshStatus. All instances stay in sync because they read
 * the same Redux state and BridgeSync context.
 */
export function usePortfolioBalance() {
  const dispatch = useDispatch();
  const { isConnected, isInternetReachable } = useNetInfo();

  const hasAccounts = !useSelector(hasNoAccountsSelector);
  const portfolio = usePortfolioAllAccounts({ range: DEFAULT_RANGE });

  const syncSources = useSyncSources();
  const lastUserSyncClickTimestamp = useSelector(selectLastUserSyncClickTimestamp);
  const hasCompletedInitialSync = useSelector(selectHasCompletedInitialSync);

  const balanceAvailable = portfolio.balanceAvailable;
  const isColdStart = hasAccounts && !balanceAvailable;
  const isInitialLoading = hasAccounts && !hasCompletedInitialSync;
  const isManualRefreshLoading = useManualRefresh(
    syncSources.stablePending,
    lastUserSyncClickTimestamp,
  );
  const isBalanceLoading = isColdStart || isInitialLoading || isManualRefreshLoading;

  const prevStablePendingRef = useRef(false);
  useEffect(() => {
    const wasPending = prevStablePendingRef.current;
    prevStablePendingRef.current = syncSources.stablePending;

    if (hasCompletedInitialSync) return;

    const transitioned = wasPending && !syncSources.stablePending;
    const alreadySettled = !syncSources.stablePending && balanceAvailable;
    if (transitioned || alreadySettled) {
      dispatch(setHasCompletedInitialSync(true));
    }
  }, [syncSources.stablePending, hasCompletedInitialSync, balanceAvailable, dispatch]);

  const accountsWithUpToDateCheck = useSelector(accountsWithUpToDateCheckSelector);
  const { allAccounts, accountsWithError, areAllAccountsUpToDate } =
    useAccountsSyncStatus(accountsWithUpToDateCheck);

  const hasEverBeenUpToDateRef = useRef(areAllAccountsUpToDate);
  useEffect(() => {
    if (areAllAccountsUpToDate) {
      hasEverBeenUpToDateRef.current = true;
    }
  }, [areAllAccountsUpToDate]);

  const hasAccountDegradation = hasEverBeenUpToDateRef.current && !areAllAccountsUpToDate;
  const isOffline = isConnected === false || isInternetReachable === false;
  const hasAnySyncError =
    syncSources.hasCvOrBridgeError ||
    hasAccountDegradation ||
    syncSources.hasWalletSyncError ||
    isOffline;

  // When offline with no specific bridge errors, every account is impacted
  const accountsImpactedByError =
    isOffline && accountsWithError.length === 0 ? allAccounts : accountsWithError;
  const errorCurrencyIds = useMemo(
    () => accountsImpactedByError.map(a => getAccountCurrency(a).id),
    [accountsImpactedByError],
  );
  const maybeAccountNames = useBatchMaybeAccountName(accountsImpactedByError);
  const listOfErrorAccountNames = useMemo(
    () =>
      maybeAccountNames
        .map((name, i) => name ?? getDefaultAccountName(accountsImpactedByError[i]))
        .join("/"),
    [maybeAccountNames, accountsImpactedByError],
  );

  const syncPhase: SyncPhase = useSyncLifecycle(
    isBalanceLoading,
    syncSources.stablePending,
    hasAnySyncError,
  );

  const { triggerRefresh } = syncSources;
  const syncPhaseRef = useRef(syncPhase);
  syncPhaseRef.current = syncPhase;

  const handleSync = useCallback(() => {
    const now = Date.now();
    dispatch(setLastUserSyncClickTimestamp(now));
    triggerRefresh();
    track("SyncRefreshClick", {
      triggeredAfterSyncError: syncPhaseRef.current === "failed",
    });
  }, [dispatch, triggerRefresh]);

  return {
    portfolio,
    balanceAvailable,
    syncPhase,
    isBalanceLoading,
    isColdStart,
    isManualRefreshLoading,
    isBridgeSyncPending: syncSources.stablePending,
    allAccounts,
    accountsWithError,
    accountsImpactedByError,
    errorCurrencyIds,
    listOfErrorAccountNames,
    areAllAccountsUpToDate,
    hasAccounts,
    handleSync,
    triggerRefresh,
  };
}
