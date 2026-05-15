import React from "react";
import type { AssetDetailMarketInfo, AssetMarketData } from "@ledgerhq/asset-detail";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetHeaderView } from "./AssetHeaderView";
import { useAssetHeaderViewModel } from "./useAssetHeaderViewModel";

export type AssetHeaderProps = Readonly<{
  assetLabel: string;
  icon: React.ReactNode;
  distributionItem: DistributionItem | undefined;
  market: AssetMarketData;
  marketInfo: AssetDetailMarketInfo | undefined;
  ledgerCurrency: CryptoOrTokenCurrency | undefined;
}>;

export function AssetHeader({
  assetLabel,
  icon,
  distributionItem,
  market,
  marketInfo,
  ledgerCurrency,
}: AssetHeaderProps) {
  const viewModel = useAssetHeaderViewModel();

  return (
    <AssetHeaderView
      assetLabel={assetLabel}
      icon={icon}
      viewModel={viewModel}
      distributionItem={distributionItem}
      market={market}
      marketInfo={marketInfo}
      ledgerCurrency={ledgerCurrency}
    />
  );
}
