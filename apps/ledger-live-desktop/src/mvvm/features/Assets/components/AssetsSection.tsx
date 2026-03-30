import React, { useCallback } from "react";
import { DataTableRoot, DataTable } from "@ledgerhq/lumen-ui-react";
import { Row } from "@tanstack/react-table";
import { AssetsSectionHeader } from "./AssetsSectionHeader";
import { useTable } from "../hooks/useTable";
import { AssetSectionData, AssetTableItem } from "../types";

export const AssetSection = ({
  sectionId,
  title,
  items,
  totalCount,
  onNavigate,
  onItemClick,
}: AssetSectionData) => {
  const table = useTable(items);

  const onRowClick = useCallback(
    (row: Row<AssetTableItem>) => {
      onItemClick(row.original);
    },
    [onItemClick],
  );

  return (
    <div className="flex flex-col gap-12">
      <AssetsSectionHeader
        sectionId={sectionId}
        title={title}
        onNavigate={onNavigate}
        numberOfItems={totalCount}
      />
      <DataTableRoot table={table} appearance="plain" onRowClick={onRowClick}>
        <DataTable />
      </DataTableRoot>
    </div>
  );
};
