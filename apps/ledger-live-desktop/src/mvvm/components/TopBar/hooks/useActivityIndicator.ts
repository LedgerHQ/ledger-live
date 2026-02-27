import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useSelector } from "LLD/hooks/redux";
import { hasAccountsSelector, isUpToDateSelector } from "~/renderer/reducers/accounts";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import { useWalletSyncUserState } from "LLD/features/WalletSync/components/WalletSyncContext";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import {
  createTriggerSync,
  getAggregateSyncState,
  useAccountsSyncStatus,
  useBridgeSync,
  useGlobalSyncState,
} from "@ledgerhq/live-common/bridge/react/index";
import { getEnv } from "@ledgerhq/live-env";
import { track } from "~/renderer/analytics/segment";

import { usePortfolioSyncStatus } from "LLD/hooks/usePortfolioSyncStatus";
import { useActivityIndicatorTooltip } from "./useActivityIndicatorTooltip";
import { getActivityIndicatorIcon } from "../utils/getActivityIndicatorIcon";
import {
  PLAYWRIGHT_CLICK_SPIN_DURATION_MS,
  TOOLTIP_UPDATE_INTERVAL_MS,
  USER_CLICK_SPIN_DURATION_MS,
} from "../utils/constants";

/**
 * Activity indicator state for the TopBar sync button.
 * When isRotating is true, the sync action should be non-interactive (disabled).
 */
export const useActivityIndicator = () => {
  const hasAccounts = useSelector(hasAccountsSelector);
  const accountsWithUpToDateCheck = useSelector(isUpToDateSelector);
  const {
    isBalanceLoading,
    stableSyncPending,
    hasCvOrBridgeError,
    hasWalletSyncError,
    triggerRefresh,
  } = usePortfolioBalanceSync();
  const [lastClickTime, setLastClickTime] = useState(0);
  const [, forceTooltipUpdate] = useReducer((tick: number) => tick + 1, 0);

  const { accountsWithError, areAllAccountsUpToDate, lastSyncMs } =
    useAccountsSyncStatus(accountsWithUpToDateCheck);
  const maybeAccountNames = useBatchMaybeAccountName(accountsWithError);
  const listOfErrorAccountNames = useMemo(
    () =>
      maybeAccountNames
        .map((name, i) => name ?? getDefaultAccountName(accountsWithError[i]))
        .join("/"),
    [maybeAccountNames, accountsWithError],
  );

  const needsTooltipUpdates = hasAccounts && lastSyncMs > 0;
  useEffect(() => {
    if (!needsTooltipUpdates) return;
    const id = setInterval(forceTooltipUpdate, TOOLTIP_UPDATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [needsTooltipUpdates]);

  const { isPending, isError } = getAggregateSyncState({
    areAllAccountsUpToDate,
    bridgeOrCvPending: cvPolling.pending || globalSyncState.pending,
    bridgeOrCvError: !!cvPolling.error || !!globalSyncState.error,
    walletSyncPending: wsUserState.visualPending,
    walletSyncError: !!wsUserState.walletSyncError,
  });
  const isPlaywrightRun = getEnv("PLAYWRIGHT_RUN");
  const userClickSpinMs = isPlaywrightRun
    ? PLAYWRIGHT_CLICK_SPIN_DURATION_MS
    : USER_CLICK_SPIN_DURATION_MS;
  const isUserClick = Date.now() - lastClickTime < userClickSpinMs;
  const isRotating = isBalanceLoading || (isUserClick && stableSyncPending);

  const icon = getActivityIndicatorIcon(isError, isRotating);
  const tooltip = useActivityIndicatorTooltip({
    isRotating,
    isError,
    listOfErrorAccountNames,
    lastSyncMs,
  });

  const handleSync = useCallback(() => {
    createTriggerSync({
      onUserRefresh: wsUserState.onUserRefresh,
      poll: cvPolling.poll,
      bridgeSync,
      reason: "user-click",
    })();
    setLastClickTime(Date.now());
    track("SyncRefreshClick");
  }, [triggerRefresh]);

  return {
    hasAccounts,
    handleSync,
    isError,
    isRotating,
    isDisabled: isRotating,
    tooltip,
    icon,
  };
};
