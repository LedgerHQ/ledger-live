import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector, hasAccountsSelector } from "~/renderer/reducers/accounts";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { usePortfolio } from "@ledgerhq/live-countervalues-react/portfolio";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { useBridgeSync, useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { useWalletSyncUserState } from "LLD/features/WalletSync/components/WalletSyncContext";
import { NEW_FLOW_RANGE, POLLING_FINISHED_DELAY_MS } from "LLD/features/Portfolio/utils/constants";
import { useStablePending } from "LLD/hooks/useStablePending";

export interface UsePortfolioBalanceSyncOptions {
  /** When true, use the user's selected time range instead of NEW_FLOW_RANGE (e.g. for legacy Portfolio views). */
  readonly legacyRange?: boolean;
}

/**
 * Single source for portfolio balance and all sync state that affects it or the TopBar indicator.
 * Used by Balance (loading shimmer) and TopBar activity indicator (rotate, error, refresh).
 *
 * - Portfolio: accounts, range, counterValue → balanceAvailable, isColdStart
 * - Sync state: CV polling + bridge sync + wallet sync → isSyncPending, stableSyncPending, errors
 * - isBalanceLoading = cold start or any sync pending (CV, bridge, wallet) so Balance shows loading
 *   whenever the data that drives it is being refreshed.
 * - triggerRefresh = run wallet refresh + CV poll + bridge SYNC_ALL_ACCOUNTS (TopBar calls this on click).
 */
export function usePortfolioBalanceSync(options: UsePortfolioBalanceSyncOptions = {}) {
  const { legacyRange = false } = options;
  const accounts = useSelector(accountsSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const hasAccounts = useSelector(hasAccountsSelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const range = legacyRange ? selectedTimeRange : NEW_FLOW_RANGE;

  const portfolio = usePortfolio({
    accounts,
    range,
    to: counterValue,
  });

  const cvPolling = useCountervaluesPolling();
  const globalSyncState = useGlobalSyncState();
  const wsUserState = useWalletSyncUserState();
  const bridgeSync = useBridgeSync();

  const isSyncPending = cvPolling.pending || globalSyncState.pending || wsUserState.visualPending;
  const stableSyncPending = useStablePending(isSyncPending, POLLING_FINISHED_DELAY_MS);

  const balanceAvailable = portfolio.balanceAvailable;
  const isColdStart = hasAccounts && !balanceAvailable;
  const isBalanceLoading = isColdStart || stableSyncPending;

  const hasCvOrBridgeError = !isSyncPending && (!!cvPolling.error || !!globalSyncState.error);
  const hasWalletSyncError = !!wsUserState.walletSyncError;

  const triggerRefresh = useCallback(() => {
    wsUserState.onUserRefresh();
    cvPolling.poll();
    bridgeSync({
      type: "SYNC_ALL_ACCOUNTS",
      priority: 5,
      reason: "user-click",
    });
  }, [wsUserState, cvPolling, bridgeSync]);

  return {
    portfolio,
    counterValue,
    balanceAvailable,
    isColdStart,
    isBalanceLoading,
    stableSyncPending,
    hasCvOrBridgeError,
    hasWalletSyncError,
    triggerRefresh,
  };
}
