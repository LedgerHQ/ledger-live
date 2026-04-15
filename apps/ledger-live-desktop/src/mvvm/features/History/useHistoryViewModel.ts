import { useNavigate } from "react-router";
import { useCallback, useMemo } from "react";
import type { Virtualizer } from "@tanstack/react-virtual";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useHistoryOperations } from "./hooks/useHistoryOperations";
import { useHistoryTable } from "./hooks/useHistoryTable";
import { useHistoryVirtualization } from "./hooks/useHistoryVirtualization";
import type { HistoryTable, OperationRow, VirtualItem } from "./types";
import { track } from "~/renderer/analytics/segment";

export type HistoryViewModel = {
  navigateToDashboard: () => void;
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
  const navigate = useNavigate();

  const navigateToDashboard = useCallback(() => {
    navigate("/");
  }, [navigate]);

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
    navigateToDashboard,
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
