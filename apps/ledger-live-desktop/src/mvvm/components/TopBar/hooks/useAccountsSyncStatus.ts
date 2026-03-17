import { useEffect, useMemo } from "react";
import { useLocation } from "react-router";
import {
  useAccountsSyncStatus as useAccountsSyncStatusCommon,
  type AccountWithUpToDateCheck,
} from "@ledgerhq/live-common/bridge/react/index";
import { track } from "~/renderer/analytics/segment";

export type { AccountWithUpToDateCheck };

export interface AccountsSyncStatus {
  allAccounts: AccountWithUpToDateCheck["account"][];
  listOfErrorAccountNames: string;
  areAllAccountsUpToDate: boolean;
}

export function useAccountsSyncStatus(
  accountsWithUpToDateCheck: AccountWithUpToDateCheck[],
): AccountsSyncStatus {
  const location = useLocation();

  const { allAccounts, accountsWithError, areAllAccountsUpToDate } =
    useAccountsSyncStatusCommon(accountsWithUpToDateCheck);

  const listOfErrorAccountNames = useMemo(() => {
    const errorTickersSet = new Set<string>();
    for (const account of accountsWithError) {
      errorTickersSet.add(account.currency.ticker);
    }
    return [...errorTickersSet].join("/");
  }, [accountsWithError]);

  useEffect(() => {
    for (const account of accountsWithError) {
      track("SyncError", { currency: account.currency.ticker, page: location.pathname });
    }
  }, [accountsWithError, location.pathname]);

  return {
    allAccounts,
    listOfErrorAccountNames,
    areAllAccountsUpToDate,
  };
}
