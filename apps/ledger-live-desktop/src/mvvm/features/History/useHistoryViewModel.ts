import { useNavigate } from "react-router";
import { useCallback } from "react";
import type { Virtualizer } from "@tanstack/react-virtual";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useHistoryOperations } from "./hooks/useHistoryOperations";
import { useHistoryTable } from "./hooks/useHistoryTable";
import { useHistoryVirtualization } from "./hooks/useHistoryVirtualization";
import type { HistoryTable, OperationRow, VirtualItem } from "./types";

export type HistoryViewModel = {
  navigateToDashboard: () => void;
  table: HistoryTable;
  parentRef: React.RefObject<HTMLDivElement | null>;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  flatItems: VirtualItem[];
  onRowClick: (row: OperationRow) => void;
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
    setDrawer(OperationDetails, {
      operationId: operation.id,
      accountId: account.id,
      parentId: parentAccount?.id,
    });
  }, []);

  return {
    navigateToDashboard,
    table,
    parentRef,
    rowVirtualizer,
    flatItems,
    onRowClick,
  };
}
