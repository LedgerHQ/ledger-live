import React, { useCallback } from "react";
import { DataTableRoot, DataTable } from "@ledgerhq/lumen-ui-react";
import { Row } from "@tanstack/react-table";
import { AssetsSectionHeader } from "./AssetsSectionHeader";
import { useAssetsTable, type AssetTableItem } from "@features/platform-assets-table";
import type { AssetSectionData } from "../types";

export const AssetSection = ({
  sectionId,
  title,
  items,
  totalCount,
  onNavigate,
  onItemClick,
}: AssetSectionData) => {
  const table = useAssetsTable(items);

  const onRowClick = useCallback(
    (row: Row<AssetTableItem>) => {
      onItemClick(row.original);
    },
    [onItemClick],
  );

  return (
    <div className="flex flex-col gap-12" data-testid={`${sectionId}-section`}>
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
