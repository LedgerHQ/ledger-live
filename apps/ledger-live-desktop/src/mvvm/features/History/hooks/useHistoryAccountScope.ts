import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import type { Account } from "@ledgerhq/types-live";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  expandRequestedAccountIdsForHistoryScope,
  filterTopLevelAccountsByAllowedAccountIds,
  parseAccountIdsSearchParam,
} from "../utils/accountScopeForHistory";

export function useHistoryAccountScope(): {
  rootAccounts: Account[];
  operationAccountIds: ReadonlySet<string> | null;
} {
  const [searchParams] = useSearchParams();
  const accountIdsQuery = searchParams.get("accountIds");
  const allAccounts = useSelector(accountsSelector);

  return useMemo(() => {
    const ids = parseAccountIdsSearchParam(accountIdsQuery);
    if (!ids) return { rootAccounts: allAccounts, operationAccountIds: null };
    const requested = new Set(ids);
    return {
      rootAccounts: filterTopLevelAccountsByAllowedAccountIds(allAccounts, requested),
      operationAccountIds: expandRequestedAccountIdsForHistoryScope(allAccounts, requested),
    };
  }, [accountIdsQuery, allAccounts]);
}
