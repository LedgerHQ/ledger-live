import { useLumenDataTable } from "@ledgerhq/lumen-ui-react";
import type { OperationTableItem, ColumnDef } from "../types";

const columns: ColumnDef<OperationTableItem>[] = [
  { accessorKey: "type", enableSorting: false },
  { accessorKey: "address", enableSorting: false, meta: { align: "end" as const } },
  { accessorKey: "amount", enableSorting: false, meta: { align: "end" as const } },
  { id: "value", accessorKey: "amount", enableSorting: false, meta: { align: "end" as const } },
];

export function useHistoryTable(data: OperationTableItem[]) {
  return useLumenDataTable({ data, columns });
}
