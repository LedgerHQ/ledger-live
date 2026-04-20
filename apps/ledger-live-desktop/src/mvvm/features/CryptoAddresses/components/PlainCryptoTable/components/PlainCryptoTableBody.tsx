import React from "react";
import { TableBody, TableCell, TableRow } from "@ledgerhq/lumen-ui-react";
import {
  flexRender,
  type Row,
  type RowData,
  type Table as TanStackTable,
} from "@tanstack/react-table";

/** Resolves click target when `target` is a Text node (no `closest`). */
function eventTargetElement(target: EventTarget | null): Element | null {
  if (target == null) return null;
  if (target instanceof Element) return target;
  if (target instanceof Text) return target.parentElement;
  return null;
}

/**
 * Clicks on these targets should not trigger row navigation.
 * Native `button` / `a[href]` cover IconButton and links. Form controls cover future inputs.
 * We intentionally omit `[role="button"]`: Lumen `TableCellContent` uses it for the name cell,
 * which should still activate the row click handler.
 */
const ROW_CLICK_IGNORE_SELECTOR =
  'button, a[href], input, textarea, select, [contenteditable="true"]';

type PlainCryptoTableBodyProps<TData extends RowData> = {
  readonly table: TanStackTable<TData>;
  readonly onRowClick?: (row: Row<TData>) => void;
  readonly getRowTestId?: (row: Row<TData>) => string | undefined;
};

export function PlainCryptoTableBody<TData extends RowData>({
  table,
  onRowClick,
  getRowTestId,
}: PlainCryptoTableBodyProps<TData>) {
  const clickable = !!onRowClick;

  const handleRowClick = (row: Row<TData>) => (e: React.MouseEvent<HTMLTableRowElement>) => {
    const el = eventTargetElement(e.target);
    if (el?.closest(ROW_CLICK_IGNORE_SELECTOR)) return;
    onRowClick?.(row);
  };

  return (
    <TableBody>
      {table.getRowModel().rows.map(row => (
        <TableRow
          key={row.id}
          clickable={clickable}
          onClick={clickable ? handleRowClick(row) : undefined}
          data-testid={getRowTestId?.(row)}
        >
          {row.getVisibleCells().map(cell => {
            const meta = cell.column.columnDef.meta;
            return (
              <TableCell
                key={cell.id}
                align={meta?.align}
                hideBelow={meta?.hideBelow}
                className={meta?.className}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </TableBody>
  );
}
