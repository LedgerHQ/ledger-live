import React, { useCallback } from "react";
import type { Row } from "@tanstack/react-table";
import { useAssetsTable } from "LLD/components/AssetsTable/useAssetsTable";
import type { AssetTableItem } from "LLD/components/AssetsTable/types";
import { CryptoAssetsView } from "./CryptoAssetsView";
import useCryptoAssetsViewModel from "./hooks/useCryptoAssetsViewModel";

export default function CryptoAssets() {
  const { items, title, isLoading, onAssetRowClick, onBack, trackingType } =
    useCryptoAssetsViewModel();
  const table = useAssetsTable(items, { showTrendColumnTooltip: false });

  const onRowClick = useCallback(
    (row: Row<AssetTableItem>) => {
      onAssetRowClick(row.original);
    },
    [onAssetRowClick],
  );

  return (
    <CryptoAssetsView
      title={title}
      onBack={onBack}
      isLoading={isLoading}
      table={table}
      onRowClick={onRowClick}
      trackingType={trackingType}
    />
  );
}
