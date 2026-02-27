import React from "react";
import { DataTableRoot, DataTable } from "@ledgerhq/lumen-ui-react";
import { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/types";
import { AssetsSectionHeader } from "./AssetsSectionHeader";
import { useTable } from "../hooks/useTable";

type AssetSectionProps = {
  readonly sectionId: string;
  readonly title: string;
  readonly assets: CategorizedAssetItem[];
  readonly onNavigate: () => void;
};

export const AssetSection = ({ sectionId, title, assets, onNavigate }: AssetSectionProps) => {
  const table = useTable(assets);
  return (
    <div className="flex flex-col gap-12">
      <AssetsSectionHeader sectionId={sectionId} title={title} onNavigate={onNavigate} />
      <DataTableRoot table={table} appearance="plain">
        <DataTable />
      </DataTableRoot>
    </div>
  );
};
