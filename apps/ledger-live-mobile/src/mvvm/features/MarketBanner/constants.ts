import type { MarketBannerRanking } from "~/reducers/types";

export const MARKET_BANNER_TILE_COUNT = 7;

export const DEFAULT_RANKING_WITHOUT_DISCOVERABILITY: MarketBannerRanking = "gainers";

export const PAGE_NAME = "Wallet";
export const BANNER_NAME = "Market Banner";

export const MARKET_BANNER_FILTER_LABEL_KEYS: Record<MarketBannerRanking, string> = {
  trending: "marketBanner.filter.options.trending",
  gainers: "marketBanner.filter.options.gainers",
  losers: "marketBanner.filter.options.losers",
  favorites: "marketBanner.filter.options.favorites",
};

export const MARKET_BANNER_TEST_IDS = {
  filterButton: "market-banner-filter-button",
  filterDrawer: "market-banner-filter-drawer",
} as const;
