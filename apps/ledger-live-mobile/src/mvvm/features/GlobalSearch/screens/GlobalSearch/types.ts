import type { StockSuggestion } from "@features/platform-aggregated-assets";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";

export type GlobalSearchDefaultSections = {
  cryptos: MarketAssetDisplayData[];
  stocks: StockSuggestion[];
};
