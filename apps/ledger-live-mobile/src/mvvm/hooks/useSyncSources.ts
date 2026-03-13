import { useCallback } from "react";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { useBridgeSync, useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { useStablePending } from "./useStablePending";
import { useWalletSyncUserState } from "LLM/features/WalletSync/components/WalletSyncContext";

const POLLING_FINISHED_DELAY_MS = 200;

export interface SyncSourcesState {
  readonly isPending: boolean;
  readonly stablePending: boolean;
  readonly hasCvOrBridgeError: boolean;
  readonly hasWalletSyncError: boolean;
  readonly triggerRefresh: () => void;
}

export function useSyncSources(): SyncSourcesState {
  const cvPolling = useCountervaluesPolling();
  const globalSyncState = useGlobalSyncState();
  const wsUserState = useWalletSyncUserState();
  const bridgeSync = useBridgeSync();

  const isPending = cvPolling.pending || globalSyncState.pending || wsUserState.visualPending;
  const stablePending = useStablePending(isPending, POLLING_FINISHED_DELAY_MS);

  const hasCvOrBridgeError = !isPending && (!!cvPolling.error || !!globalSyncState.error);
  const hasWalletSyncError = !!wsUserState.walletSyncError;

  const { onUserRefresh } = wsUserState;
  const { poll } = cvPolling;

  const triggerRefresh = useCallback(() => {
    onUserRefresh();
    poll();
    bridgeSync({
      type: "SYNC_ALL_ACCOUNTS",
      priority: 5,
      reason: "user-click",
    });
  }, [onUserRefresh, poll, bridgeSync]);

  return {
    isPending,
    stablePending,
    hasCvOrBridgeError,
    hasWalletSyncError,
    triggerRefresh,
  };
}
