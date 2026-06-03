import { useCallback, useEffect, useMemo } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { markOperationsAsSeen } from "~/renderer/reducers/history";
import type { Virtualizer } from "@tanstack/react-virtual";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useHistoryOperations } from "./useHistoryOperations";
import { useHistoryTable } from "./useHistoryTable";
import { useHistoryVirtualization } from "./useHistoryVirtualization";
import type { HistoryTable, OperationRow, VirtualItem } from "../types";
import { track } from "~/renderer/analytics/segment";
import { parseHistoryBackPath } from "../utils/historyLocationState";
import { usePopNavigationBack } from "LLD/utils/usePopNavigationBack";

export type HistoryViewModel = {
  showBackButton: boolean;
  navigateBack: () => void;
  table: HistoryTable;
  parentRef: React.RefObject<HTMLDivElement | null>;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  flatItems: VirtualItem[];
  onRowClick: (row: OperationRow) => void;
  onExportClick: () => void;
  operationsCount: number;
  hasPendingOperations: boolean;
};

export function useHistoryViewModel(): HistoryViewModel {
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(markOperationsAsSeen());
    };
  }, [dispatch]);

  const { showBackButton, navigateBack } = usePopNavigationBack(parseHistoryBackPath);

  const operations = useHistoryOperations();
  const table = useHistoryTable(operations);
  const { parentRef, rowVirtualizer, flatItems } = useHistoryVirtualization(table);

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

  const onExportClick = () => track("ExportAccountOperations");
  const operationsCount = flatItems.length;
  const hasPendingOperations = useMemo(() => operations.some(op => op.isPending), [operations]);

  return {
    showBackButton,
    navigateBack,
    table,
    parentRef,
    rowVirtualizer,
    flatItems,
    onRowClick,
    onExportClick,
    operationsCount,
    hasPendingOperations,
  };
}
