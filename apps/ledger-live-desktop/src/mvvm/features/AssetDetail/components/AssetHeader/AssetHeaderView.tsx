import React from "react";
import {
  NavBar,
  NavBarBackButton,
  NavBarCoinCapsule,
  NavBarTrailing,
} from "@ledgerhq/lumen-ui-react";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { OptionsMenu } from "../OptionsMenu";
import type { AssetHeaderViewModel } from "./useAssetHeaderViewModel";

export type AssetHeaderViewProps = Readonly<{
  assetLabel: string;
  icon: React.ReactNode;
  viewModel: AssetHeaderViewModel;
  distributionItem?: DistributionItem;
  marketData: AssetMarketData;
  ledgerCurrency?: CryptoOrTokenCurrency;
}>;

export function AssetHeaderView({
  assetLabel,
  icon,
  viewModel,
  distributionItem,
  marketData,
  ledgerCurrency,
}: AssetHeaderViewProps) {
  const { onBack } = viewModel;

  return (
    <NavBar
      data-testid="asset-detail-header"
      className="sticky top-0 z-10 w-full min-w-0 items-center gap-4 bg-canvas py-12"
    >
      <NavBarBackButton onClick={onBack} />
      <NavBarCoinCapsule className="min-w-0 max-w-full" ticker={assetLabel} icon={icon} />
      <NavBarTrailing className="overflow-visible">
        {ledgerCurrency ? (
          <OptionsMenu
            distributionItem={distributionItem}
            marketData={marketData}
            currency={ledgerCurrency}
          />
        ) : null}
      </NavBarTrailing>
    </NavBar>
  );
}
