import { useCallback } from "react";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { useBridgeSync } from "./context";
import { useGlobalSyncState } from "./useGlobalSyncState";
import { useStablePending } from "./useStablePending";

export const POLLING_FINISHED_DELAY_MS = 200;

export interface WalletSyncUserState {
  readonly visualPending: boolean;
  readonly walletSyncError: Error | null;
  readonly onUserRefresh: () => void;
}

export interface SyncSourcesState {
  readonly isPending: boolean;
  readonly stablePending: boolean;
  readonly hasCvOrBridgeError: boolean;
  readonly hasWalletSyncError: boolean;
  readonly triggerRefresh: () => void;
}

/**
 * Aggregates the three sync sources (countervalues, bridge, wallet sync) into
 * a single unified state. This is the raw sync plumbing layer — no lifecycle
 * or loading semantics.
 *
 * `walletSyncState` is injected so each platform can provide its own
 * context-based implementation (LLD / LLM WalletSyncContext).
 */
export function useSyncSources(walletSyncState: WalletSyncUserState): SyncSourcesState {
  const cvPolling = useCountervaluesPolling();
  const globalSyncState = useGlobalSyncState();
  const bridgeSync = useBridgeSync();

  const isPending = cvPolling.pending || globalSyncState.pending || walletSyncState.visualPending;
  const stablePending = useStablePending(isPending, POLLING_FINISHED_DELAY_MS);

  const hasCvOrBridgeError = !isPending && (!!cvPolling.error || !!globalSyncState.error);
  const hasWalletSyncError = !!walletSyncState.walletSyncError;

  const { onUserRefresh } = walletSyncState;
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
