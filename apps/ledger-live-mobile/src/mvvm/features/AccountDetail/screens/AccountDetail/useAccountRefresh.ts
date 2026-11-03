import { useCallback, useEffect, useState } from "react";
import { track } from "@shared/analytics";
import type { Account } from "@ledgerhq/types-live";
import { ACCOUNT_DETAIL_EVENTS, accountPullToRefreshProps } from "@features/flow-account-detail";
import { getAccountTrackingFacts } from "../../utils/accountTracking";
import { useNetworkState } from "@shared/network-status";
import { useCountervaluesPolling } from "@features/platform-market-countervalues";
import { useAccountSyncState, useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { SYNC_DELAY } from "~/utils/constants";

export type AccountRefresh = Readonly<{
  onRefresh: () => void;
  lastClickTimestamp: number;
  lastOfflineAttemptTimestamp: number;
}>;

export function useAccountRefresh(account: Account | undefined): AccountRefresh {
  const accountId = account?.id;
  const setSyncBehavior = useBridgeSync();
  const { poll } = useCountervaluesPolling();
  const { error } = useAccountSyncState({ accountId });
  const { isConnected, isInternetReachable } = useNetworkState();

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
    if (account) {
      track(
        ACCOUNT_DETAIL_EVENTS.buttonClicked,
        accountPullToRefreshProps(getAccountTrackingFacts(account), Boolean(error)),
      );
    }
  }, [
    account,
    accountId,
    isRefreshing,
    isConnected,
    isInternetReachable,
    poll,
    setSyncBehavior,
    error,
  ]);

  return { onRefresh, lastClickTimestamp, lastOfflineAttemptTimestamp };
}
