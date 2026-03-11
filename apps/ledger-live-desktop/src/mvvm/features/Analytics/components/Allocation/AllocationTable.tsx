import React, { useCallback } from "react";
import { useAllocationTable } from "../../hooks/useAllocationTable";
import { useInfiniteScroll } from "LLD/hooks/useInfiniteScroll";
import { DataTable, DataTableRoot, Spot, DataTableRootProps } from "@ledgerhq/lumen-ui-react";
import type { AllocationTableItem, AllocationViewProps } from "../../types";

export const AllocationTable = ({ items, hasMore, showMore, onItemClick }: AllocationViewProps) => {
  const table = useAllocationTable(items);
  const sentinelRef = useInfiniteScroll(showMore, hasMore);

  const onRowClick = useCallback<
    NonNullable<DataTableRootProps<AllocationTableItem>["onRowClick"]>
  >(row => onItemClick(row.original), [onItemClick]);

  return (
    <div className="flex flex-col">
      <DataTableRoot table={table} appearance="plain" onRowClick={onRowClick}>
        <DataTable />
      </DataTableRoot>
      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-16"
          data-testid="allocation-loader"
        >
          <Spot appearance="loader" size={48} />
        </div>
      )}
    </div>
  );
};
