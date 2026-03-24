import React from "react";
import { TableRoot, Table } from "@ledgerhq/lumen-ui-react";
import { Virtualizer } from "@tanstack/react-virtual";
import { HistoryTableHeader } from "../components/HistoryTableHeader";
import { HistoryTableBody } from "../components/HistoryTableBody";
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
  return (
    <TableRoot ref={parentRef} appearance="plain" className="min-h-0 flex-1 overflow-auto mb-32">
      <Table>
        <HistoryTableHeader />
        <HistoryTableBody
          rowVirtualizer={rowVirtualizer}
          flatItems={flatItems}
          columnCount={table.getVisibleFlatColumns().length}
          onRowClick={onRowClick}
        />
      </Table>
    </TableRoot>
  );
}

export { HistoryList };
