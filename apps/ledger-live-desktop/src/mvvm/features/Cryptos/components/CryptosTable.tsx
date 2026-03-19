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
import { useCryptosDataTable } from "../hooks/useCryptosDataTable";

/** Resolves click target when `target` is a Text node (no `closest`). */
function eventTargetElement(target: EventTarget | null): Element | null {
  if (target == null) return null;
  if (target instanceof Element) return target;
  if (target instanceof Text) return target.parentElement;
  return null;
}

type CryptosTableProps = {
  rows: AccountLike[];
  lookupParentAccount: (id: string) => Account | undefined | null;
  onRowClick: (account: AccountLike, parentAccount?: Account | null) => void;
};

export function CryptosTable({ rows, lookupParentAccount, onRowClick }: CryptosTableProps) {
  const { table, handleRowClick } = useCryptosDataTable({ rows, lookupParentAccount, onRowClick });

  return (
    <TableRoot>
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
                if (el?.closest("button, a[href]")) return;
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
