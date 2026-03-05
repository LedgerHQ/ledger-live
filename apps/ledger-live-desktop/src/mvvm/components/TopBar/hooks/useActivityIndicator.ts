import { useCallback, useEffect, useReducer, useRef } from "react";
import { useLocation } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { hasAccountsSelector, isUpToDateSelector } from "~/renderer/reducers/accounts";
import { setLastUserSyncClickTimestamp } from "~/renderer/reducers/syncRefresh";
import { track } from "~/renderer/analytics/segment";

import { usePortfolioBalanceSync } from "LLD/hooks/usePortfolioBalanceSync";
import { useAccountsSyncStatus } from "./useAccountsSyncStatus";
import { useActivityIndicatorTooltip } from "./useActivityIndicatorTooltip";
import { getActivityIndicatorIcon } from "../utils/getActivityIndicatorIcon";
import { TOOLTIP_UPDATE_INTERVAL_MS } from "../utils/constants";

/**
 * Activity indicator state for the TopBar sync button.
 * When isRotating is true, the sync action should be non-interactive (disabled).
 */
export const useActivityIndicator = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const hasAccounts = useSelector(hasAccountsSelector);
  const accountsWithUpToDateCheck = useSelector(isUpToDateSelector);
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

  const hasEverBeenUpToDate = useRef(areAllAccountsUpToDate);
  useEffect(() => {
    if (areAllAccountsUpToDate) {
      hasEverBeenUpToDate.current = true;
    }
  }, [areAllAccountsUpToDate]);

  const isSyncSettled = !isBalanceLoading && !stableSyncPending;
  const hasAccountDegradation = hasEverBeenUpToDate.current && !areAllAccountsUpToDate;
  const hasAnySyncError = hasCvOrBridgeError || hasAccountDegradation || hasWalletSyncError;
  const isError = isSyncSettled && hasAnySyncError;
  const isRotating = isBalanceLoading;

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
    track("SyncRefreshClick", {
      triggeredAfterSyncError: isError,
    });
  }, [dispatch, triggerRefresh, isError]);

  const onTooltipShow = useCallback(() => {
    if (isError) {
      track("SyncErrorList", {
        page: location.pathname,
        currencies: listOfErrorAccountNames
          ? listOfErrorAccountNames.split("/").filter(Boolean)
          : [],
      });
    }
  }, [isError, listOfErrorAccountNames, location.pathname]);

  return {
    hasAccounts,
    handleSync,
    isError,
    isRotating,
    tooltip,
    icon,
    onTooltipShow: isError ? onTooltipShow : undefined,
  };
};
