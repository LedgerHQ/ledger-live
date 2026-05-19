import type { DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AssetDetailMarketInfo, AssetMarketData } from "@ledgerhq/asset-detail";

export type AssetDetailReady = {
  mode: "ready";
  distributionItem: DistributionItem | undefined;
  marketInfo: AssetDetailMarketInfo | undefined;
  market: AssetMarketData;
  ledgerCurrency: CryptoOrTokenCurrency | undefined;
  assetName: string;
  assetTicker: string;
  ledgerId: string | undefined;
  isLoading: boolean;
};

export type AssetDetailViewModel = AssetDetailReady | { mode: "loading" } | { mode: "not-found" };
