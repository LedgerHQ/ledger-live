import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { useNetInfo } from "@react-native-community/netinfo";
import { accountsWithUpToDateCheckSelector, hasNoAccountsSelector } from "~/reducers/accounts";
import { useBatchMaybeAccountName } from "~/reducers/wallet";
import { getDefaultAccountName } from "@domain/entity-account-name";
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
import { useAfterFirstHomeLayout } from "./useAfterFirstHomeLayout";

const DEFAULT_RANGE = "day" as const;

export function usePortfolioSyncState() {
  const dispatch = useDispatch();
  const { isConnected, isInternetReachable } = useNetInfo();
  const hasAccounts = !useSelector(hasNoAccountsSelector);
  const syncSources = useSyncSources();
  const lastUserSyncClickTimestamp = useSelector(selectLastUserSyncClickTimestamp);
  const hasCompletedInitialSync = useSelector(selectHasCompletedInitialSync);
  const isColdStart = hasAccounts && !hasCompletedInitialSync;
  const isManualRefreshLoading = useManualRefresh(
    syncSources.stablePending,
    lastUserSyncClickTimestamp,
  );
  const isBalanceLoading = isColdStart || isManualRefreshLoading;

  const prevStablePendingRef = useRef(false);
  useEffect(() => {
    const wasPending = prevStablePendingRef.current;
    prevStablePendingRef.current = syncSources.stablePending;
    if (hasCompletedInitialSync) {
      return;
    }
    if (wasPending && !syncSources.stablePending) {
      dispatch(setHasCompletedInitialSync(true));
    }
  }, [dispatch, hasCompletedInitialSync, syncSources.stablePending]);

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
    syncPhase,
    isBalanceLoading,
    isColdStart,
    isManualRefreshLoading,
    isBridgeSyncPending: syncSources.stablePending,
    isCvPending: syncPhase === "syncing" && syncSources.cvPending,
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

export function usePortfolioBalance() {
  const homeReady = useAfterFirstHomeLayout();
  const sync = usePortfolioSyncState();
  const portfolio = usePortfolioAllAccounts({ range: DEFAULT_RANGE, skip: !homeReady });
  return {
    ...sync,
    portfolio,
    balanceAvailable: portfolio.balanceAvailable,
    isColdStart: sync.hasAccounts && !portfolio.balanceAvailable,
  };
}
