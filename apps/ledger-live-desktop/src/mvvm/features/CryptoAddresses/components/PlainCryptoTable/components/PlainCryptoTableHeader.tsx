import React from "react";
import {
  TableHeader,
  TableHeaderCell,
  TableHeaderRow,
  TableSortButton,
} from "@ledgerhq/lumen-ui-react";
import {
  flexRender,
  type Header,
  type RowData,
  type Table as TanStackTable,
} from "@tanstack/react-table";

type PlainCryptoTableHeaderProps<TData extends RowData> = {
  readonly table: TanStackTable<TData>;
};

/** Renders label or a sort control; only for non-placeholder headers. */
function plainCryptoTableHeaderCell<TData extends RowData>(
  header: Header<TData, unknown>,
  label: React.ReactNode,
  align: React.ComponentProps<typeof TableSortButton>["align"],
): React.ReactNode {
  if (!header.column.getCanSort()) return label;
  return (
    <TableSortButton
      sortDirection={header.column.getIsSorted() || undefined}
      onClick={header.column.getToggleSortingHandler()}
      align={align}
    >
      {label}
    </TableSortButton>
  );
}

export function PlainCryptoTableHeader<TData extends RowData>({
  table,
}: PlainCryptoTableHeaderProps<TData>) {
  return (
    <TableHeader>
      {table.getHeaderGroups().map(headerGroup => (
        <TableHeaderRow key={headerGroup.id} className="z-10">
          {headerGroup.headers.map(header => {
            const meta = header.column.columnDef.meta;
            const align = meta?.align;

            const headerContent = header.isPlaceholder
              ? null
              : plainCryptoTableHeaderCell(
                  header,
                  flexRender(header.column.columnDef.header, header.getContext()),
                  align,
                );

            return (
              <TableHeaderCell
                key={header.id}
                align={align}
                hideBelow={meta?.hideBelow}
                className={meta?.className}
                trailingContent={meta?.headerTrailingContent}
              >
                {headerContent}
              </TableHeaderCell>
            );
          })}
        </TableHeaderRow>
      ))}
    </TableHeader>
  );
}
