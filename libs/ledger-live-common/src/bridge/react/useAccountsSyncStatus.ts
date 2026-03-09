import { useBatchAccountsSyncState } from "./useAccountSyncState";
import type { Account } from "@ledgerhq/types-live";

export interface AccountWithUpToDateCheck {
  account: Account;
  isUpToDate?: boolean;
}

export interface AccountsSyncStatus {
  allAccounts: Account[];
  accountsWithError: Account[];
  areAllAccountsUpToDate: boolean;
  lastSyncMs: number;
}

export function useAccountsSyncStatus(
  accountsWithUpToDateCheck: AccountWithUpToDateCheck[],
): AccountsSyncStatus {
  const allAccounts = accountsWithUpToDateCheck.map(item => item.account);
  const isUpToDateByAccountId = new Map(
    accountsWithUpToDateCheck.map(item => [item.account.id, item.isUpToDate ?? true]),
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
