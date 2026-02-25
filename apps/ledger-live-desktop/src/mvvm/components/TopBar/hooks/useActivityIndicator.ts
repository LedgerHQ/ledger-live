import { useCallback, useEffect, useState } from "react";
import { useSelector } from "LLD/hooks/redux";
import { hasAccountsSelector, isUpToDateSelector } from "~/renderer/reducers/accounts";
import { useWalletSyncUserState } from "LLD/features/WalletSync/components/WalletSyncContext";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { useBridgeSync, useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { getEnv } from "@ledgerhq/live-env";
import { track } from "~/renderer/analytics/segment";

import { useAccountsSyncStatus } from "./useAccountsSyncStatus";
import { useActivityIndicatorTooltip } from "./useActivityIndicatorTooltip";
import { getActivityIndicatorIcon } from "../utils/getActivityIndicatorIcon";
import {
  PLAYWRIGHT_CLICK_SPIN_DURATION_MS,
  TOOLTIP_UPDATE_INTERVAL_MS,
  USER_CLICK_SPIN_DURATION_MS,
} from "../utils/constants";

export const useActivityIndicator = () => {
  const hasAccounts = useSelector(hasAccountsSelector);
  const accountsWithUpToDateCheck = useSelector(isUpToDateSelector);
  const wsUserState = useWalletSyncUserState();
  const cvPolling = useCountervaluesPolling();
  const bridgeSync = useBridgeSync();
  const globalSyncState = useGlobalSyncState();
  const [lastClickTime, setLastClickTime] = useState(0);
  const [, setTick] = useState(0);

  const { allAccounts, listOfErrorAccountNames, areAllAccountsUpToDate } =
    useAccountsSyncStatus(accountsWithUpToDateCheck);

  const lastSyncMs = Math.max(...allAccounts.map(a => a.lastSyncDate?.getTime() ?? 0), 0);

  const needsTooltipUpdates = hasAccounts && lastSyncMs > 0;
  useEffect(() => {
    if (!needsTooltipUpdates) return;
    const id = setInterval(() => setTick(t => t + 1), TOOLTIP_UPDATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [needsTooltipUpdates]);

  const isPending = cvPolling.pending || globalSyncState.pending || wsUserState.visualPending;
  const hasWalletSyncError = !!wsUserState.walletSyncError;
  const hasBridgeOrCvSyncError = !isPending && (!!cvPolling.error || !!globalSyncState.error);
  const isError = hasBridgeOrCvSyncError || !areAllAccountsUpToDate || hasWalletSyncError;
  const isPlaywrightRun = getEnv("PLAYWRIGHT_RUN");
  const userClickSpinMs = isPlaywrightRun
    ? PLAYWRIGHT_CLICK_SPIN_DURATION_MS
    : USER_CLICK_SPIN_DURATION_MS;
  const isUserClick = Date.now() - lastClickTime < userClickSpinMs;
  const isRotating = isPending && isUserClick;
  const isDisabled = isRotating;

  const icon = getActivityIndicatorIcon(isError, isRotating);
  const tooltip = useActivityIndicatorTooltip({
    isRotating,
    isError,
    listOfErrorAccountNames,
    lastSyncMs,
  });

  const handleSync = useCallback(() => {
    wsUserState.onUserRefresh();
    cvPolling.poll();
    bridgeSync({
      type: "SYNC_ALL_ACCOUNTS",
      priority: 5,
      reason: "user-click",
    });
    setLastClickTime(Date.now());
    track("SyncRefreshClick");
  }, [wsUserState, cvPolling, bridgeSync]);

  return {
    hasAccounts,
    handleSync,
    isError,
    isRotating,
    isDisabled,
    tooltip,
    icon,
  };
};
