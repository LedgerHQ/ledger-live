import { useMemo } from "react";
import {
  useAccountsSyncStatus as useAccountsSyncStatusCommon,
  type AccountWithUpToDateCheck,
} from "@ledgerhq/live-common/bridge/react/index";

export type { AccountWithUpToDateCheck };

export interface AccountsSyncStatus {
  allAccounts: AccountWithUpToDateCheck["account"][];
  listOfErrorAccountNames: string;
  areAllAccountsUpToDate: boolean;
}

export function useAccountsSyncStatus(
  accountsWithUpToDateCheck: AccountWithUpToDateCheck[],
): AccountsSyncStatus {
  const { allAccounts, accountsWithError, areAllAccountsUpToDate } =
    useAccountsSyncStatusCommon(accountsWithUpToDateCheck);

  const listOfErrorAccountNames = useMemo(() => {
    const errorTickersSet = new Set<string>();
    for (const account of accountsWithError) {
      errorTickersSet.add(account.currency.ticker);
    }
    return [...errorTickersSet].join("/");
  }, [accountsWithError]);

  return {
    allAccounts,
    listOfErrorAccountNames,
    areAllAccountsUpToDate,
  };
}
