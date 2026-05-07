import type { DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  MarketCurrencyData,
  PartialMarketItemResponse,
} from "@ledgerhq/live-common/market/utils/types";

export type AssetDetailMarketInfo = Readonly<{
  id?: string;
  ledgerIds: string[];
  name?: string;
  ticker?: string;
  price?: number;
}>;

export type AssetDetailMarketSource = MarketCurrencyData | PartialMarketItemResponse | undefined;

export type AssetDetailReady = {
  mode: "ready";
  distributionItem: DistributionItem | undefined;
  marketInfo: AssetDetailMarketInfo | undefined;
  ledgerCurrency: CryptoOrTokenCurrency | undefined;
  assetName: string;
  assetTicker: string;
  ledgerId: string | undefined;
  isLoading: boolean;
};

export type AssetDetailViewModel = AssetDetailReady | { mode: "loading" } | { mode: "not-found" };
