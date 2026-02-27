import { useBatchAccountsSyncState } from "./useAccountSyncState";
import type { Sync } from "./types";
import { Account } from "@ledgerhq/types-live";

export interface AccountWithUpToDateCheck {
  account: Account;
  isUpToDate?: boolean;
}

export interface AccountsSyncStatus {
  allAccounts: AccountWithUpToDateCheck["account"][];
  accountsWithError: Account[];
  areAllAccountsUpToDate: boolean;
  lastSyncMs: number;
}

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

export function useAccountsSyncStatus(
  accountsWithUpToDateCheck: AccountWithUpToDateCheck[],
): AccountsSyncStatus {
  const allAccounts = accountsWithUpToDateCheck.map(item => item.account);
  const isUpToDateByAccountId = new Map(
    accountsWithUpToDateCheck.map(item => [item.account.id, item.isUpToDate === true]),
  );

  const batchState = useBatchAccountsSyncState({ accounts: allAccounts });
  const accountsWithError: Account[] = [];
  for (const { syncState, account } of batchState) {
    if (syncState.pending) continue;
    const isUpToDate = isUpToDateByAccountId.get(account.id);
    if (syncState.error || !isUpToDate) {
      accountsWithError.push(account);
    }
  }

  const areAllAccountsUpToDate = accountsWithError.length === 0;
  const lastSyncMs = Math.max(...allAccounts.map(a => a.lastSyncDate?.getTime() ?? 0), 0);

  return {
    allAccounts,
    accountsWithError,
    areAllAccountsUpToDate,
    lastSyncMs,
  };
}
