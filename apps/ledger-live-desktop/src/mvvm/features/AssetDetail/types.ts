import type { DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AssetMarketData } from "@ledgerhq/asset-detail";

type AssetDetailLoading = Readonly<{ mode: "loading" }>;
type AssetDetailNotFound = Readonly<{ mode: "not-found" }>;

export type AssetDetailReady = Readonly<{
  mode: "ready";
  distributionItem?: DistributionItem;
  marketData: AssetMarketData;
  ledgerCurrency?: CryptoOrTokenCurrency;
  displayName: string;
  displayTicker: string;
  ledgerId?: string;
}>;

export type AssetDetailViewModel = AssetDetailLoading | AssetDetailNotFound | AssetDetailReady;
