import React from "react";
import {
  TableRoot,
  Table,
  TableHeader,
  TableHeaderRow,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ledgerhq/lumen-ui-react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { flexRender } from "@tanstack/react-table";
import { useCryptoDataTable } from "./hooks/useCryptoDataTable";

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

type CryptoTableProps = {
  readonly rows: AccountLike[];
  readonly lookupParentAccount: (id: string) => Account | undefined | null;
  readonly onRowClick: (account: AccountLike, parentAccount?: Account | null) => void;
};

export function CryptoTable({ rows, lookupParentAccount, onRowClick }: CryptoTableProps) {
  const { table, handleRowClick } = useCryptoDataTable({ rows, lookupParentAccount, onRowClick });

  return (
    <TableRoot appearance="plain">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableHeaderRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHeaderCell key={header.id} align={header.column.columnDef.meta?.align}>
                  {!header.isPlaceholder &&
                    flexRender(header.column.columnDef.header, header.getContext())}
                </TableHeaderCell>
              ))}
            </TableHeaderRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow
              key={row.id}
              clickable
              onClick={e => {
                const el = eventTargetElement(e.target);
                if (el?.closest(ROW_CLICK_IGNORE_SELECTOR)) return;
                handleRowClick(row);
              }}
            >
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id} align={cell.column.columnDef.meta?.align}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableRoot>
  );
}
