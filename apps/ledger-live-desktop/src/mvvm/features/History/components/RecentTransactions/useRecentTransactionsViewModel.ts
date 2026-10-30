import { useMemo } from "react";
import type { HistoryTable, OperationRow, OperationTableItem } from "../../types";
import { useHistoryTable } from "../../hooks/useHistoryTable";
import { useHistoryOperationItemsForRootAccounts } from "../../hooks/useHistoryOperationItemsForRootAccounts";
import { filterOperationTableItemsByAllowedAccountIds } from "../../utils/accountScopeForHistory";
import { useRecentAccountScope } from "./useRecentAccountScope";
import { useRecentTransactionActions } from "./useRecentTransactionActions";

const RECENT_TRANSACTIONS_COUNT = 3;

export type RecentTransactionsParams = Readonly<{
  accountIds: readonly string[];
  trackingPage: string;
  trackingCurrencyId?: string;
  backPath: string;
}>;

export type RecentTransactionsViewModel = Readonly<{
  visible: boolean;
  pending: boolean;
  table: HistoryTable;
  onRowClick: (row: OperationRow) => void;
  onSeeAll: () => void;
}>;

export function useRecentTransactionItems(accountIds: readonly string[]): OperationTableItem[] {
  const { allowedAccountIds, rootAccounts } = useRecentAccountScope(accountIds);
  const operationItemsFromRoots = useHistoryOperationItemsForRootAccounts(rootAccounts);
  return useMemo(
    () => filterOperationTableItemsByAllowedAccountIds(operationItemsFromRoots, allowedAccountIds),
    [allowedAccountIds, operationItemsFromRoots],
  );
}

export function useRecentTransactionsViewModel({
  accountIds,
  trackingPage,
  trackingCurrencyId,
  backPath,
  items,
  pending,
}: RecentTransactionsParams &
  Readonly<{ items: OperationTableItem[]; pending: boolean }>): RecentTransactionsViewModel {
  const accountIdsKey = accountIds.join(",");
  const recentItems = useMemo(() => items.slice(0, RECENT_TRANSACTIONS_COUNT), [items]);
  const table = useHistoryTable(recentItems);
  const { onRowClick, onSeeAll } = useRecentTransactionActions({
    accountIdsKey,
    trackingPage,
    trackingCurrencyId,
    backPath,
  });

  return {
    visible: items.length > 0,
    pending,
    table,
    onRowClick,
    onSeeAll,
  };
}
