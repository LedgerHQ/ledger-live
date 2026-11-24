/** Price variation windows, keyed as the UI and the market list read them. */
export enum KeysPriceChange {
  hour = "1h",
  day = "24h",
  week = "7d",
  month = "30d",
  sixMonths = "6m",
  year = "1y",
}

/** Sort orders of the market list. */
export enum Order {
  MarketCapDesc = "desc",
  MarketCapAsc = "asc",
  topLosers = "topLosers",
  topGainers = "topGainers",
  VolumeDesc = "volume-desc",
  VolumeAsc = "volume-asc",
}

/** Page sizes the `/v3/markets` endpoint accepts. */
export const MARKET_LIST_PAGE_SIZES = [1, 5, 20, 50] as const;

export type MarketListPageSize = (typeof MARKET_LIST_PAGE_SIZES)[number];

/** A search shorter than this is not sent to the market list. */
export const MARKET_LIST_MIN_SEARCH_LENGTH = 2;

/** Arguments of the market list, paginated by `pageSize`. `limit` caps the total across pages. */
export type MarketListQueryArg = {
  counterCurrency?: string;
  pageSize: MarketListPageSize;
  /** Max number of results across pages. A page size stays on `pageSize`. */
  limit?: number;
  order?: Order;
  range?: string;
  search?: string;
  filter?: string;
  starred?: string[];
  liveCompatible?: boolean;
  categories?: string;
};

export type SparklineSvgData = {
  path: string;
  viewBox: string;
  isPositive: boolean;
};

/** Chart series keyed by range, as the market currency carries them. */
export type MarketCurrencyChartData = Record<string, Array<[number, number]>>;

/** A currency as the market list and the market detail read it. */
export type MarketCurrency = {
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
  chartData: MarketCurrencyChartData;
};
