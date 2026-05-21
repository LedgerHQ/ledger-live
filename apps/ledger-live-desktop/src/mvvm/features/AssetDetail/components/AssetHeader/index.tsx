import React from "react";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetHeaderView } from "./AssetHeaderView";
import { useAssetHeaderViewModel } from "./useAssetHeaderViewModel";

export type AssetHeaderProps = Readonly<{
  assetLabel: string;
  icon: React.ReactNode;
  distributionItem?: DistributionItem;
  marketData: AssetMarketData;
  ledgerCurrency?: CryptoOrTokenCurrency;
}>;

export function AssetHeader({
  assetLabel,
  icon,
  distributionItem,
  marketData,
  ledgerCurrency,
}: AssetHeaderProps) {
  const viewModel = useAssetHeaderViewModel();

  return (
    <AssetHeaderView
      assetLabel={assetLabel}
      icon={icon}
      viewModel={viewModel}
      distributionItem={distributionItem}
      marketData={marketData}
      ledgerCurrency={ledgerCurrency}
    />
  );
}
