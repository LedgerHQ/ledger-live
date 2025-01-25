import { Account } from "@ledgerhq/types-live";
import { useBridgeSyncState } from "./context";
import type { SyncState } from "./types";

const nothingState: SyncState = {
  pending: false,
  error: null,
};

export function useAccountSyncState({
  accountId,
}: {
  accountId?: string | null;
} = {}): SyncState {
  const syncState = useBridgeSyncState();
  return (accountId && syncState[accountId]) || nothingState;
}

interface AccountWithSyncState {
  account: Account;
  syncState: SyncState;
}

export function useBatchAccountsSyncState({
  accounts,
}: {
  accounts?: (Account | null)[];
} = {}): AccountWithSyncState[] {
  const syncState = useBridgeSyncState();
  if (!accounts || !accounts?.length) return [];

  return accounts.reduce((acc, account) => {
    if (account) {
      acc.push({
        account,
        syncState: syncState[account.id] || nothingState,
      });
    }
    return acc;
  }, [] as AccountWithSyncState[]);
}
