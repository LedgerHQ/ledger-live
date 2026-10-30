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

  const rootAccounts = useMemo(() => {
    const ids = parseAccountIdsSearchParam(accountIdsQuery);
    if (!ids) return allAccounts;
    return filterTopLevelAccountsByAllowedAccountIds(allAccounts, new Set(ids));
  }, [accountIdsQuery, allAccounts]);

  const operationAccountIds = useMemo(() => {
    const ids = parseAccountIdsSearchParam(accountIdsQuery);
    if (!ids) return null;
    return expandRequestedAccountIdsForHistoryScope(allAccounts, new Set(ids));
  }, [accountIdsQuery, allAccounts]);

  return { rootAccounts, operationAccountIds };
}
