import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { StockSuggestion } from "LLD/features/Stocks/types";

export type SearchMode = "suggestions" | "results" | "noResults";

export type AssetSuggestionSection = {
  data: MarketCurrencyData[];
  isLoading: boolean;
};

export type StocksSuggestionSection = {
  data: StockSuggestion[];
  isLoading: boolean;
};

export type SearchSuggestions = {
  cryptos: AssetSuggestionSection;
  stablecoins: AssetSuggestionSection;
  stocks: StocksSuggestionSection;
};

export type SearchResults = {
  data: MarketCurrencyData[];
  isLoading: boolean;
};

export type SearchOverlayContextValue = {
  close: () => void;
  navigateToAsset: (currencyId: string) => void;
  navigateToStocksMarket: () => void;
  suggestions: SearchSuggestions;
  results: SearchResults;
  mode: SearchMode;
};
