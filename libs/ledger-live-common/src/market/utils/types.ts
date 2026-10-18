import { PortfolioRange } from "@ledgerhq/types-live";

export type ChartDataPoint = [number, number];
export type MarketCoinDataChart = Record<string, Array<ChartDataPoint>>;

export enum Order {
  MarketCapDesc = "desc",
  MarketCapAsc = "asc",
  topLosers = "topLosers",
  topGainers = "topGainers",
  VolumeDesc = "volume-desc",
  VolumeAsc = "volume-asc",
}

export type MarketListRequestParams = {
  counterCurrency?: string;
  starred?: string[];
  limit?: number;
  range?: string;
  order?: Order;
  search?: string;
  filter?: string;
  liveCompatible?: boolean;
  categories?: string;
};

export type MarketListRequestResult = {
  data: MarketCurrencyData[];
  isPending: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  /** Refetches every loaded page. */
  refetch: () => void;
  resetToFirstPage: () => void;
};

type MarketCounterValueParams = {
  id?: string;
  counterCurrency?: string;
};

export type MarketCurrencyRequestParams = MarketCounterValueParams & {
  /** Ledger currency ids to resolve via the /v3/markets `ledgerIds` filter. */
  ledgerIds?: string[];
};

export type MarketAssetChartDataRequestParams = MarketCounterValueParams & {
  range?: string;
};

export type SparklineSvgData = {
  path: string;
  viewBox: string;
  isPositive: boolean;
};

export enum KeysPriceChange {
  hour = "1h",
  day = "24h",
  week = "7d",
  month = "30d",
  sixMonths = "6m",
  year = "1y",
}

export type MarketCurrencyData = {
  id: string;
  ledgerIds: string[];
  name: string;
  image?: string;
  marketcap?: number;
  marketcapRank: number;
  totalVolume: number;
  high24h: number;
  low24h: number;
  ticker: string;
  price: number;
  priceChangePercentage: Record<KeysPriceChange, number>;
  marketCapChangePercentage24h: number;
  circulatingSupply: number;
  totalSupply?: number;
  maxSupply?: number;
  ath: number;
  athDate: Date;
  atl: number;
  atlDate: Date;
  sparklineIn7d?: SparklineSvgData;
  chartData: MarketCoinDataChart;
};

export type MarketPerformersParams = {
  limit: number;
  top: number;
  sort: "asc" | "desc";
  range: PortfolioRange;
  counterCurrency: string;
  supported: boolean;
  refreshRate?: number;
};

export type TrendingPerformersParams = {
  counterCurrency: string;
  refreshRate?: number;
};

export type MarketItemResponse = {
  allTimeHigh: number;
  allTimeHighDate: string;
  allTimeLow: number;
  allTimeLowDate: string;
  circulatingSupply: number;
  fullyDilutedValuation: number;
  high24h: number;
  currencyId: string;
  id: string;
  image: string;
  ledgerIds: string[];
  low24h: number;
  marketCap: number;
  marketCapChange24h: number;
  marketCapChangePercentage24h: number;
  marketCapRank: number;
  maxSupply: number;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercentage1h: number;
  priceChangePercentage24h: number;
  priceChangePercentage30d: number;
  priceChangePercentage7d: number;
  priceChangePercentage6m?: number;
  priceChangePercentage1y: number;
  sparkline: number[];
  ticker: string;
  totalSupply: number;
  totalVolume: number;
  updatedAt: string;
};

export type PartialMarketItemResponse = Partial<MarketItemResponse>;

export type MarketItemPerformer = {
  id: string;
  name: string;
  ticker: string;
  priceChangePercentage1h: number;
  priceChangePercentage24h: number;
  priceChangePercentage7d: number;
  priceChangePercentage30d: number;
  priceChangePercentage1y: number;
  image: string;
  price: number;
  ledgerIds: string[];
};
