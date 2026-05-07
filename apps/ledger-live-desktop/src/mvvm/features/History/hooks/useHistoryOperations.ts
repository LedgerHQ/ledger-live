import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import type { OperationTableItem } from "../types";
import {
  expandRequestedAccountIdsForHistoryScope,
  filterOperationTableItemsByAllowedAccountIds,
  filterTopLevelAccountsByAllowedAccountIds,
  parseAccountIdsSearchParam,
} from "../utils/accountScopeForHistory";
import { useHistoryOperationItemsForRootAccounts } from "./useHistoryOperationItemsForRootAccounts";

export function useHistoryOperations(): OperationTableItem[] {
  const [searchParams] = useSearchParams();
  const accountIdsQuery = searchParams.get("accountIds");
  const allAccounts = useSelector(accountsSelector);

  const rootAccounts = useMemo(() => {
    const ids = parseAccountIdsSearchParam(accountIdsQuery);
    if (!ids) return allAccounts;
    return filterTopLevelAccountsByAllowedAccountIds(allAccounts, new Set(ids));
  }, [accountIdsQuery, allAccounts]);

  const baseOperationItems = useHistoryOperationItemsForRootAccounts(rootAccounts);

  const operationAccountIds = useMemo(() => {
    const ids = parseAccountIdsSearchParam(accountIdsQuery);
    if (!ids) return null;
    return expandRequestedAccountIdsForHistoryScope(allAccounts, new Set(ids));
  }, [accountIdsQuery, allAccounts]);

  return useMemo(() => {
    if (!operationAccountIds) return baseOperationItems;
    return filterOperationTableItemsByAllowedAccountIds(baseOperationItems, operationAccountIds);
  }, [baseOperationItems, operationAccountIds]);
}
