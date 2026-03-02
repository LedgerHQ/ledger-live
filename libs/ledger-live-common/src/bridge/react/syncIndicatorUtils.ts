import type { Sync } from "./types";

export interface AggregateSyncStateParams {
  areAllAccountsUpToDate: boolean;
  bridgeOrCvPending: boolean;
  bridgeOrCvError: boolean;
  walletSyncPending: boolean;
  walletSyncError: boolean;
}

export function getAggregateSyncState({
  areAllAccountsUpToDate,
  bridgeOrCvPending,
  bridgeOrCvError,
  walletSyncPending,
  walletSyncError,
}: AggregateSyncStateParams): { isPending: boolean; isError: boolean } {
  const isPending = bridgeOrCvPending || walletSyncPending;
  const hasBridgeOrCvSyncError = !isPending && bridgeOrCvError;
  const isError = hasBridgeOrCvSyncError || !areAllAccountsUpToDate || walletSyncError;
  return { isPending, isError };
}

export interface CreateTriggerSyncParams {
  onUserRefresh: () => void;
  poll: () => void;
  bridgeSync: Sync;
  reason?: string;
}

export function createTriggerSync({
  onUserRefresh,
  poll,
  bridgeSync,
  reason = "user-click",
}: CreateTriggerSyncParams): () => void {
  return () => {
    onUserRefresh();
    poll();
    bridgeSync({ type: "SYNC_ALL_ACCOUNTS", priority: 5, reason });
  };
}
