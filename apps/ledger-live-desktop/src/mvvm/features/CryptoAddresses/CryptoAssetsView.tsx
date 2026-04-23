import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import type { Row, Table } from "@tanstack/react-table";
import PageHeader from "LLD/components/PageHeader";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { AssetTableItem } from "LLD/features/Assets/types";
import { PlainCryptoTable } from "./components/PlainCryptoTable";
import { ASSETS_TRACKING_PAGE_NAME } from "./constants";

export type CryptoAssetsViewProps = {
  readonly title: string;
  readonly onBack: () => void;
  readonly isLoading: boolean;
  readonly table: Table<AssetTableItem>;
  readonly onRowClick: (row: Row<AssetTableItem>) => void;
  readonly trackingType: "crypto" | "stable";
};

export function CryptoAssetsView({
  title,
  onBack,
  isLoading,
  table,
  onRowClick,
  trackingType,
}: CryptoAssetsViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-24">
      <TrackPage
        category={ASSETS_TRACKING_PAGE_NAME}
        source={ASSETS_TRACKING_PAGE_NAME}
        type={trackingType}
      />
      <PageHeader title={title} onBack={onBack} />
      <div data-testid="crypto-assets-page-content" className="flex min-h-0 flex-1 flex-col gap-12">
        {isLoading ? (
          <Skeleton component="table" />
        ) : (
          <PlainCryptoTable table={table} onRowClick={onRowClick} />
        )}
      </div>
    </div>
  );
}
