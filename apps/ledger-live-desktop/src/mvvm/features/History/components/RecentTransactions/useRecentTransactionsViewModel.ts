import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { track } from "@shared/analytics";
import { buildNavigationBackState } from "LLD/utils/navigationBackPath";
import { useHistoryTable } from "../../hooks/useHistoryTable";
import { useHistoryOperationItemsForRootAccounts } from "../../hooks/useHistoryOperationItemsForRootAccounts";
import {
  filterOperationTableItemsByAllowedAccountIds,
  filterTopLevelAccountsByAllowedAccountIds,
} from "../../utils/accountScopeForHistory";
import type { HistoryTable, OperationRow } from "../../types";

const RECENT_TRANSACTIONS_COUNT = 3;

export type RecentTransactionsParams = Readonly<{
  accountIds: readonly string[];
  trackingPage: string;
  trackingCurrencyId?: string;
  backPath: string;
}>;

export type RecentTransactionsViewModel = Readonly<{
  visible: boolean;
  table: HistoryTable;
  onRowClick: (row: OperationRow) => void;
  onSeeAll: () => void;
}>;

export function useRecentTransactionsViewModel({
  accountIds,
  trackingPage,
  trackingCurrencyId,
  backPath,
}: RecentTransactionsParams): RecentTransactionsViewModel {
  const navigate = useNavigate();
  const allAccounts = useSelector(accountsSelector);

  const accountIdsKey = accountIds.join(",");
  const allowedAccountIds = useMemo(
    () => new Set(accountIdsKey ? accountIdsKey.split(",") : []),
    [accountIdsKey],
  );

  const rootAccounts = useMemo(() => {
    if (allowedAccountIds.size === 0) return [];
    return filterTopLevelAccountsByAllowedAccountIds(allAccounts, allowedAccountIds);
  }, [allAccounts, allowedAccountIds]);

  const operationItemsFromRoots = useHistoryOperationItemsForRootAccounts(rootAccounts);
  const scopedOperationItems = useMemo(
    () => filterOperationTableItemsByAllowedAccountIds(operationItemsFromRoots, allowedAccountIds),
    [operationItemsFromRoots, allowedAccountIds],
  );
  const recentItems = useMemo(
    () => scopedOperationItems.slice(0, RECENT_TRANSACTIONS_COUNT),
    [scopedOperationItems],
  );

  const table = useHistoryTable(recentItems);

  const onRowClick = useCallback(
    (row: OperationRow) => {
      const { operation, account, parentAccount } = row.original;
      track("transaction_clicked", {
        transaction: operation.type,
        page: trackingPage,
        currency: trackingCurrencyId,
      });
      setDrawer(OperationDetails, {
        operationId: operation.id,
        accountId: account.id,
        parentId: parentAccount?.id,
      });
    },
    [trackingPage, trackingCurrencyId],
  );

  const onSeeAll = useCallback(() => {
    track("button_clicked", {
      button: "Transactions",
      currency: trackingCurrencyId,
      page: trackingPage,
    });
    navigate(
      `/history?accountIds=${encodeURIComponent(accountIdsKey)}`,
      buildNavigationBackState("historyBackPath", backPath),
    );
  }, [accountIdsKey, backPath, navigate, trackingCurrencyId, trackingPage]);

  return {
    visible: scopedOperationItems.length > 0,
    table,
    onRowClick,
    onSeeAll,
  };
}
