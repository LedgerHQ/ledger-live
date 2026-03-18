import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  accountsSelector,
  hasAccountsSelector,
  isUpToDateSelector,
} from "~/renderer/reducers/accounts";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { usePortfolioThrottled } from "@ledgerhq/live-countervalues-react/portfolio";
import {
  selectLastUserSyncClickTimestamp,
  selectHasCompletedInitialSync,
  setHasCompletedInitialSync,
  setLastUserSyncClickTimestamp,
} from "~/renderer/reducers/syncRefresh";
import { track } from "~/renderer/analytics/segment";
import { useSyncSources } from "./useSyncSources";
import { useSyncLifecycle, type SyncPhase } from "./useSyncLifecycle";
import { useManualRefresh } from "./useManualRefresh";
import { useAccountsSyncStatus } from "LLD/components/TopBar/hooks/useAccountsSyncStatus";
import { DEFAULT_PORTFOLIO_RANGE } from "LLD/utils/constants";

export interface UsePortfolioBalanceOptions {
  readonly legacyRange?: boolean;
}

/**
 * Single source of truth for portfolio balance and the sync lifecycle.
 *
 * Consumed by both the Balance component (shimmer / freeze / animation) and
 * the TopBar activity indicator (icon / tooltip / disabled state).
 *
 * Layers used internally:
 *   useSyncSources  → raw pending / error / triggerRefresh
 *   useManualRefresh → tracks user-click → sync-complete
 *   useSyncLifecycle → FSM: syncing | synced | failed
 */
export function usePortfolioBalance(options: UsePortfolioBalanceOptions = {}) {
  const dispatch = useDispatch();
  const { legacyRange = false } = options;

  const accounts = useSelector(accountsSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const hasAccounts = useSelector(hasAccountsSelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const range = legacyRange ? selectedTimeRange : DEFAULT_PORTFOLIO_RANGE;

  const portfolio = usePortfolioThrottled({ accounts, range, to: counterValue });

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

  const accountsWithUpToDateCheck = useSelector(isUpToDateSelector);
  const { allAccounts, listOfErrorAccountNames, areAllAccountsUpToDate } =
    useAccountsSyncStatus(accountsWithUpToDateCheck);

  const hasEverBeenUpToDateRef = useRef(areAllAccountsUpToDate);
  useEffect(() => {
    if (areAllAccountsUpToDate) {
      hasEverBeenUpToDateRef.current = true;
    }
  }, [areAllAccountsUpToDate]);

  const hasAccountDegradation = hasEverBeenUpToDateRef.current && !areAllAccountsUpToDate;
  const hasAnySyncError =
    syncSources.hasCvOrBridgeError || hasAccountDegradation || syncSources.hasWalletSyncError;

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
    counterValue,
    balanceAvailable,
    syncPhase,
    isBalanceLoading,
    isColdStart,
    allAccounts,
    listOfErrorAccountNames,
    areAllAccountsUpToDate,
    hasAccounts,
    handleSync,
  };
}
