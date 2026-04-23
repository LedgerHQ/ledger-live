import React from "react";
import { Table, TableRoot } from "@ledgerhq/lumen-ui-react";
import { type Row, type RowData, type Table as TanStackTable } from "@tanstack/react-table";

import { PlainCryptoTableBody } from "./PlainCryptoTableBody";
import { PlainCryptoTableHeader } from "./PlainCryptoTableHeader";

type PlainCryptoTableProps<TData extends RowData> = {
  readonly table: TanStackTable<TData>;
  readonly onRowClick?: (row: Row<TData>) => void;
  readonly getRowTestId?: (row: Row<TData>) => string | undefined;
};

/**
 * Shared plain table shell for Crypto addresses and Crypto assets pages.
 */
export function PlainCryptoTable<TData extends RowData>({
  table,
  onRowClick,
  getRowTestId,
}: PlainCryptoTableProps<TData>) {
  return (
    <TableRoot appearance="plain" className="min-h-0 flex-1 overflow-auto mb-32">
      <Table>
        <PlainCryptoTableHeader table={table} />
        <PlainCryptoTableBody table={table} onRowClick={onRowClick} getRowTestId={getRowTestId} />
      </Table>
    </TableRoot>
  );
}
