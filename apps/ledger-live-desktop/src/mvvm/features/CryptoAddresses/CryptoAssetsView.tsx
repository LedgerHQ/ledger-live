import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import type { Row, Table } from "@tanstack/react-table";
import PageHeader from "LLD/components/PageHeader";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { AssetTableItem } from "LLD/features/Assets/types";
import { PlainCryptoTable } from "./components/PlainCryptoTable";

export type CryptoAssetsViewProps = {
  readonly title: string;
  readonly onBack: () => void;
  readonly isLoading: boolean;
  readonly table: Table<AssetTableItem>;
  readonly onRowClick: (row: Row<AssetTableItem>) => void;
};

export function CryptoAssetsView({
  title,
  onBack,
  isLoading,
  table,
  onRowClick,
}: CryptoAssetsViewProps) {
  return (
    <div className="flex flex-col gap-32 pb-32">
      <TrackPage category="Crypto assets" />
      <PageHeader title={title} onBack={onBack} />
      <div data-testid="crypto-assets-page-content" className="flex flex-col gap-12">
        {isLoading ? (
          <Skeleton component="table" />
        ) : (
          <PlainCryptoTable table={table} onRowClick={onRowClick} />
        )}
      </div>
    </div>
  );
}
