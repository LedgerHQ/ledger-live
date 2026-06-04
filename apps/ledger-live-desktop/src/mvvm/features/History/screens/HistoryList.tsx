import React from "react";
import { TableRoot, Table } from "@ledgerhq/lumen-ui-react";
import { Virtualizer } from "@tanstack/react-virtual";
import { HistoryTableHeader } from "../components/HistoryTableHeader";
import { HistoryTableBody } from "../components/HistoryTableBody";
import { EmptyState } from "../components/EmptyState";
import type { VirtualItem, HistoryTable, OperationRow } from "../types";

type HistoryListProps = {
  readonly table: HistoryTable;
  readonly parentRef: React.RefObject<HTMLDivElement | null>;
  readonly rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  readonly flatItems: VirtualItem[];
  readonly onRowClick: (row: OperationRow) => void;
};

function HistoryList({
  table,
  parentRef,
  rowVirtualizer,
  flatItems,
  onRowClick,
}: HistoryListProps) {
  if (flatItems.length === 0) {
    return <EmptyState />;
  }

  return (
    <TableRoot
      appearance="plain"
      className="mb-32 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg"
      data-testid="history-table"
    >
      <div className="shrink-0 overflow-x-auto overflow-y-hidden">
        <Table>
          <HistoryTableHeader />
        </Table>
      </div>
      <div
        ref={parentRef}
        className="min-h-0 flex-1 overflow-auto scrollbar-custom [scrollbar-gutter:auto]"
      >
        <Table data-testid="history-table-body">
          <HistoryTableBody
            rowVirtualizer={rowVirtualizer}
            flatItems={flatItems}
            columnCount={table.getVisibleFlatColumns().length}
            onRowClick={onRowClick}
          />
        </Table>
      </div>
    </TableRoot>
  );
}

export { HistoryList };
