import { useEffect } from "react";
import { useLocation } from "react-router";
import { useBatchAccountsSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { Account } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";

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
  const location = useLocation();
  const allAccounts = accountsWithUpToDateCheck.map(item => item.account);
  const isUpToDateByAccountId = new Map(
    accountsWithUpToDateCheck.map(item => [item.account.id, item.isUpToDate === true]),
  );

  const batchState = useBatchAccountsSyncState({ accounts: allAccounts });
  const errorTickers: string[] = [];
  for (const { syncState, account } of batchState) {
    if (syncState.pending) continue;
    const isUpToDate = isUpToDateByAccountId.get(account.id);
    if (syncState.error || !isUpToDate) {
      errorTickers.push(account.currency.ticker);
    }
  }

  const listOfErrorAccountNames = [...new Set(errorTickers)].join("/");
  const areAllAccountsUpToDate = errorTickers.length === 0;

  const errorTickersKey = errorTickers.join("/");
  useEffect(() => {
    if (!errorTickersKey) return;
    for (const currency of errorTickersKey.split("/")) {
      track("SyncError", { currency, page: location.pathname });
    }
  }, [errorTickersKey, location.pathname]);

  return {
    allAccounts,
    listOfErrorAccountNames,
    areAllAccountsUpToDate,
  };
}
