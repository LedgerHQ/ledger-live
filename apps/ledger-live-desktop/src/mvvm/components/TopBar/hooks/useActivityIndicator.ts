import { useCallback, useEffect, useReducer } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { hasAccountsSelector, isUpToDateSelector } from "~/renderer/reducers/accounts";
import {
  selectLastUserSyncClickTimestamp,
  setLastUserSyncClickTimestamp,
} from "~/renderer/reducers/syncRefresh";
import { getEnv } from "@ledgerhq/live-env";
import { track } from "~/renderer/analytics/segment";

import { usePortfolioBalanceSync } from "LLD/hooks/usePortfolioBalanceSync";
import { useAccountsSyncStatus } from "./useAccountsSyncStatus";
import { useActivityIndicatorTooltip } from "./useActivityIndicatorTooltip";
import { getActivityIndicatorIcon } from "../utils/getActivityIndicatorIcon";
import {
  PLAYWRIGHT_CLICK_SPIN_DURATION_MS,
  TOOLTIP_UPDATE_INTERVAL_MS,
  USER_CLICK_SPIN_DURATION_MS,
} from "../utils/constants";
import { isRecentUserSyncClick } from "../utils/syncRefreshUtils";

/**
 * Activity indicator state for the TopBar sync button.
 * When isRotating is true, the sync action should be non-interactive (disabled).
 */
export const useActivityIndicator = () => {
  const dispatch = useDispatch();
  const hasAccounts = useSelector(hasAccountsSelector);
  const accountsWithUpToDateCheck = useSelector(isUpToDateSelector);
  const lastUserSyncClickTimestamp = useSelector(selectLastUserSyncClickTimestamp);
  const {
    isBalanceLoading,
    stableSyncPending,
    hasCvOrBridgeError,
    hasWalletSyncError,
    triggerRefresh,
  } = usePortfolioBalanceSync();
  const [, forceTooltipUpdate] = useReducer((tick: number) => tick + 1, 0);

  const { allAccounts, listOfErrorAccountNames, areAllAccountsUpToDate } =
    useAccountsSyncStatus(accountsWithUpToDateCheck);

  const lastSyncMs = Math.max(...allAccounts.map(a => a.lastSyncDate?.getTime() ?? 0), 0);

  const needsTooltipUpdates = hasAccounts && lastSyncMs > 0;
  useEffect(() => {
    if (!needsTooltipUpdates) return;
    const id = setInterval(forceTooltipUpdate, TOOLTIP_UPDATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [needsTooltipUpdates]);

  const isError = hasCvOrBridgeError || !areAllAccountsUpToDate || hasWalletSyncError;
  const isPlaywrightRun = getEnv("PLAYWRIGHT_RUN");
  const userClickSpinMs = isPlaywrightRun
    ? PLAYWRIGHT_CLICK_SPIN_DURATION_MS
    : USER_CLICK_SPIN_DURATION_MS;
  const isUserClick = isRecentUserSyncClick(lastUserSyncClickTimestamp, userClickSpinMs);
  const isRotating = isBalanceLoading || (isUserClick && stableSyncPending);

  const icon = getActivityIndicatorIcon(isError, isRotating);
  const tooltip = useActivityIndicatorTooltip({
    isRotating,
    isError,
    listOfErrorAccountNames,
    lastSyncMs,
  });

  const handleSync = useCallback(() => {
    const now = Date.now();
    dispatch(setLastUserSyncClickTimestamp(now));
    triggerRefresh();
    track("SyncRefreshClick");
  }, [dispatch, triggerRefresh]);

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
