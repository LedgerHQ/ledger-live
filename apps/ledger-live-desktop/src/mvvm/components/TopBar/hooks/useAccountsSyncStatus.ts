import { useBatchAccountsSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { Account } from "@ledgerhq/types-live";

export interface AccountWithUpToDateCheck {
  account: Account;
  isUpToDate?: boolean;
}

export interface AccountsSyncStatus {
  allAccounts: AccountWithUpToDateCheck["account"][];
  listOfErrorAccountNames: string;
  areAllAccountsUpToDate: boolean;
}

/**
 * Derives sync status from accounts with up-to-date check:
 * which accounts have errors and whether all are up to date.
 */
export function useAccountsSyncStatus(
  accountsWithUpToDateCheck: AccountWithUpToDateCheck[],
): AccountsSyncStatus {
  const allAccounts = accountsWithUpToDateCheck.map(item => item.account);
  const isUpToDateByAccountId = new Map(
    accountsWithUpToDateCheck.map(item => [item.account.id, item.isUpToDate === true]),
  );

  const batchState = useBatchAccountsSyncState({ accounts: allAccounts });
  const errorTickersSet = new Set<string>();
  for (const { syncState, account } of batchState) {
    if (syncState.pending) continue;
    const isUpToDate = isUpToDateByAccountId.get(account.id);
    if (syncState.error || !isUpToDate) {
      errorTickersSet.add(account.currency.ticker);
    }
  }

  const listOfErrorAccountNames = [...errorTickersSet].join("/");
  const areAllAccountsUpToDate = errorTickersSet.size === 0;

  return {
    allAccounts,
    listOfErrorAccountNames,
    areAllAccountsUpToDate,
  };
}
