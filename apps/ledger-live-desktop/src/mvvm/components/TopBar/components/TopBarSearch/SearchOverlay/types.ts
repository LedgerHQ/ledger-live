import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import type { AssetNavigationMarketState } from "LLD/features/Assets/types";
import type { StockSuggestion } from "LLD/features/Stocks/types";

export type SearchMode = "suggestions" | "results" | "noResults" | "error";

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
  stocks: StocksSuggestionSection;
};

export type SearchResults = {
  data: MarketCurrencyData[];
  isLoading: boolean;
  loadNext?: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

export type SearchOverlayContextValue = {
  close: () => void;
  navigateToAsset: (currencyId: string, marketState?: AssetNavigationMarketState) => void;
  navigateToMarket: () => void;
  navigateToStocksMarket: () => void;
  suggestions: SearchSuggestions;
  results: SearchResults;
  mode: SearchMode;
};
