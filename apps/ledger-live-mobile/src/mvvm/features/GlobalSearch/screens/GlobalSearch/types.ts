import type { StockSuggestion } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";

export type GlobalSearchDefaultSections = {
  cryptos: MarketAssetDisplayData[];
  stablecoins: MarketAssetDisplayData[];
  stocks: StockSuggestion[];
};
