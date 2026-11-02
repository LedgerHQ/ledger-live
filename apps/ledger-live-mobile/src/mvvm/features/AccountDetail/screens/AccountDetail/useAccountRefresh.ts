import { useCallback, useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import { track } from "@shared/analytics";
import { useNetworkState } from "@shared/network-status";
import { useCountervaluesPolling } from "@features/platform-market-countervalues";
import { useAccountSyncState, useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { SYNC_DELAY } from "~/utils/constants";

export type AccountRefresh = Readonly<{
  onRefresh: () => void;
  lastClickTimestamp: number;
  lastOfflineAttemptTimestamp: number;
}>;

export function useAccountRefresh(accountId: string | undefined): AccountRefresh {
  const setSyncBehavior = useBridgeSync();
  const { poll } = useCountervaluesPolling();
  const { error } = useAccountSyncState({ accountId });
  const { isConnected, isInternetReachable } = useNetworkState();
  const route = useRoute();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastClickTimestamp, setLastClickTimestamp] = useState(0);
  const [lastOfflineAttemptTimestamp, setLastOfflineAttemptTimestamp] = useState(0);

  useEffect(() => {
    if (!isRefreshing) return;
    const timer = setTimeout(() => setIsRefreshing(false), SYNC_DELAY);
    return () => clearTimeout(timer);
  }, [isRefreshing]);

  const onRefresh = useCallback(() => {
    if (!accountId || isRefreshing) return;
    if (isConnected === false || isInternetReachable === false) {
      setLastOfflineAttemptTimestamp(Date.now());
      return;
    }
    poll();
    setSyncBehavior({
      type: "SYNC_ONE_ACCOUNT",
      accountId,
      priority: 10,
      reason: "user-pull-to-refresh-one-account",
    });
    setIsRefreshing(true);
    setLastClickTimestamp(Date.now());
    track("button_clicked", {
      button: "pull to refresh",
      page: route.name,
      triggeredAfterSyncError: Boolean(error),
    });
  }, [
    accountId,
    isRefreshing,
    isConnected,
    isInternetReachable,
    poll,
    setSyncBehavior,
    route.name,
    error,
  ]);

  return { onRefresh, lastClickTimestamp, lastOfflineAttemptTimestamp };
}
