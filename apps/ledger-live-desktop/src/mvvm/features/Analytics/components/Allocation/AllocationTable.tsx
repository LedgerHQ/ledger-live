import React from "react";
import { useAllocationTable } from "../../hooks/useAllocationTable";
import { DataTable, DataTableRoot } from "@ledgerhq/lumen-ui-react";
import type { AllocationTableItem } from "../../types";

export const AllocationTable = ({ items }: { readonly items: AllocationTableItem[] }) => {
  const table = useAllocationTable(items);
  return (
    <DataTableRoot table={table} appearance="plain">
      <DataTable />
    </DataTableRoot>
  );
};
