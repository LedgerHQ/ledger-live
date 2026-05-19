import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import type { DistributionItem } from "@ledgerhq/types-live";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { track } from "~/renderer/analytics/segment";
import { useHistoryTable } from "LLD/features/History/hooks/useHistoryTable";
import { useHistoryOperationItemsForRootAccounts } from "LLD/features/History/hooks/useHistoryOperationItemsForRootAccounts";
import {
  filterOperationTableItemsByAllowedAccountIds,
  filterTopLevelAccountsByAllowedAccountIds,
} from "LLD/features/History/utils/accountScopeForHistory";
import type { HistoryTable, OperationRow } from "LLD/features/History/types";

const RECENT_TRANSACTIONS_COUNT = 3;

export type TransactionsSectionViewModel = Readonly<{
  visible: boolean;
  table: HistoryTable;
  onRowClick: (row: OperationRow) => void;
  onSeeAll: () => void;
}>;

export function useTransactionsSectionViewModel(
  distributionItem: DistributionItem,
): TransactionsSectionViewModel {
  const navigate = useNavigate();
  const { pathname: assetDetailPath } = useLocation();
  const allAccounts = useSelector(accountsSelector);

  const rootAccounts = useMemo(() => {
    const allowed = new Set(distributionItem.accounts.map(a => a.id));
    if (allowed.size === 0) return [];
    return filterTopLevelAccountsByAllowedAccountIds(allAccounts, allowed);
  }, [allAccounts, distributionItem.accounts]);

  const assetOperationAccountIds = useMemo(
    () => new Set(distributionItem.accounts.map(a => a.id)),
    [distributionItem.accounts],
  );

  const operationItemsFromRoots = useHistoryOperationItemsForRootAccounts(rootAccounts);
  const scopedOperationItems = useMemo(
    () =>
      filterOperationTableItemsByAllowedAccountIds(
        operationItemsFromRoots,
        assetOperationAccountIds,
      ),
    [operationItemsFromRoots, assetOperationAccountIds],
  );
  const recentItems = useMemo(
    () => scopedOperationItems.slice(0, RECENT_TRANSACTIONS_COUNT),
    [scopedOperationItems],
  );

  const table = useHistoryTable(recentItems);

  const onRowClick = useCallback((row: OperationRow) => {
    const { operation, account, parentAccount } = row.original;
    track("transaction_clicked", {
      transaction: operation.type,
    });
    setDrawer(OperationDetails, {
      operationId: operation.id,
      accountId: account.id,
      parentId: parentAccount?.id,
    });
  }, []);

  const onSeeAll = useCallback(() => {
    const query = distributionItem.accounts.map(a => a.id).join(",");
    navigate(`/history?accountIds=${encodeURIComponent(query)}`, {
      state: { historyBackPath: assetDetailPath },
    });
  }, [assetDetailPath, distributionItem.accounts, navigate]);

  return {
    visible: scopedOperationItems.length > 0,
    table,
    onRowClick,
    onSeeAll,
  };
}
