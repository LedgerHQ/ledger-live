import React from "react";
import { TableBody } from "@ledgerhq/lumen-ui-react";
import { Virtualizer } from "@tanstack/react-virtual";
import { DayHeader } from "./DayHeader";
import { SectionHeader } from "./SectionHeader";
import { OperationRow } from "./OperationRow";
import type { OperationRow as OperationRowType, VirtualItem } from "../types";

type HistoryTableBodyProps = {
  readonly rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  readonly flatItems: VirtualItem[];
  readonly columnCount: number;
  readonly onRowClick: (row: OperationRowType) => void;
};

export function HistoryTableBody({
  rowVirtualizer,
  flatItems,
  columnCount,
  onRowClick,
}: HistoryTableBodyProps) {
  const virtualItems = rowVirtualizer.getVirtualItems();

  // TODO: add empty state (next iteration)

  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualItems[0]?.start ?? 0;
  const paddingBottom = totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0);

  return (
    <TableBody>
      {paddingTop > 0 && (
        <tr>
          <td colSpan={columnCount} style={{ height: paddingTop, padding: 0, border: 0 }} />
        </tr>
      )}
      {virtualItems.map(virtualRow => {
        const item = flatItems[virtualRow.index];
        if (!item) return null;

        if (item.type === "section-header") {
          return (
            <SectionHeader
              key={`section-${item.labelKey}`}
              labelKey={item.labelKey}
              count={item.count}
              columnCount={item.columnCount}
            />
          );
        }

        if (item.type === "day-header") {
          return (
            <DayHeader
              key={`day-${item.day.toISOString()}`}
              day={item.day}
              columnCount={item.columnCount}
            />
          );
        }

        return <OperationRow key={item.row.id} row={item.row} onRowClick={onRowClick} />;
      })}
      {paddingBottom > 0 && (
        <tr>
          <td colSpan={columnCount} style={{ height: paddingBottom, padding: 0, border: 0 }} />
        </tr>
      )}
    </TableBody>
  );
}
