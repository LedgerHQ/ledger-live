import { useEffect, useRef } from "react";
import { useSelector } from "LLD/hooks/redux";
import { hasAccountsSelector, isUpToDateSelector } from "~/renderer/reducers/accounts";
import {
  selectHasCompletedInitialSync,
  selectLastUserSyncClickTimestamp,
} from "~/renderer/reducers/syncRefresh";
import {
  useSyncLifecycle,
  type SyncPhase,
} from "@ledgerhq/live-common/bridge/react/useSyncLifecycle";
import { useManualRefresh } from "@ledgerhq/live-common/bridge/react/useManualRefresh";
import { useAccountsSyncStatus } from "LLD/components/TopBar/hooks/useAccountsSyncStatus";
import { useSyncSources } from "./useSyncSources";

/**
 * Lightweight alternative to usePortfolioBalance for consumers that only need
 * the current SyncPhase. Skips usePortfolioThrottled entirely, avoiding the
 * full portfolio computation and its subscriptions.
 *
 * isColdStart is intentionally omitted: isInitialLoading
 * (hasAccounts && !hasCompletedInitialSync) covers the same "no data yet"
 * window without requiring portfolio data.
 */
export function useSyncPhase(): SyncPhase {
  const hasAccounts = useSelector(hasAccountsSelector);
  const hasCompletedInitialSync = useSelector(selectHasCompletedInitialSync);
  const lastUserSyncClickTimestamp = useSelector(selectLastUserSyncClickTimestamp);

  const syncSources = useSyncSources();

  const isManualRefreshLoading = useManualRefresh(
    syncSources.stablePending,
    lastUserSyncClickTimestamp,
  );
  const isInitialLoading = hasAccounts && !hasCompletedInitialSync;
  const isBalanceLoading = isInitialLoading || isManualRefreshLoading;

  const accountsWithUpToDateCheck = useSelector(isUpToDateSelector);
  const { areAllAccountsUpToDate } = useAccountsSyncStatus(accountsWithUpToDateCheck);

  const hasEverBeenUpToDateRef = useRef(areAllAccountsUpToDate);
  useEffect(() => {
    if (areAllAccountsUpToDate) {
      hasEverBeenUpToDateRef.current = true;
    }
  }, [areAllAccountsUpToDate]);

  const hasAccountDegradation = hasEverBeenUpToDateRef.current && !areAllAccountsUpToDate;
  const hasAnySyncError =
    syncSources.hasCvOrBridgeError || hasAccountDegradation || syncSources.hasWalletSyncError;

  return useSyncLifecycle(isBalanceLoading, syncSources.stablePending, hasAnySyncError);
}
