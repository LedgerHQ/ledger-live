import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { RefetchOptions, QueryObserverResult } from "@tanstack/react-query";
import { PortfolioRange } from "@ledgerhq/types-live";

export type MarketCoin = {
  id: string;
  name: string;
  symbol: string;
};

export type ChartDataPoint = [number, number];
export type MarketCoinDataChart = Record<string, Array<ChartDataPoint>>;

export enum Order {
  MarketCapDesc = "desc",
  MarketCapAsc = "asc",
  topLosers = "topLosers",
  topGainers = "topGainers",
}

export type SupportedCoins = MarketCoin[];

export type MarketListRequestParams = {
  counterCurrency?: string;
  starred?: string[];
  page?: number;
  limit?: number;
  range?: string;
  order?: Order;
  search?: string;
  liveCompatible?: boolean;
  liveCoinsList?: string[];
};

export type MarketListRequestResult = {
  data: CurrencyData[];
  isPending: boolean;
  isLoading: boolean;
  isError: boolean;
  cachedMetadataMap: Map<string, HashMapBody>;
};

export type HashMapBody = {
  updatedAt: number;
  refetch: (options?: RefetchOptions | undefined) => Promise<
    QueryObserverResult<
      {
        formattedData: CurrencyData[];
        page: number;
      },
      Error
    >
  >;
};

export type MarketCurrencyChartDataRequestParams = {
  id?: string;
  counterCurrency?: string;
  range?: string;
  lastRequestTime?: Date;
};

export type MarketCurrencyRequestParams = {
  id?: string;
  counterCurrency?: string;
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
  year = "1y",
}

export type CurrencyData = {
  id: string;
  name: string;
  image?: string;
  internalCurrency?: CryptoOrTokenCurrency;
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
  totalSupply: number;
  maxSupply: number;
  ath: number;
  athDate: Date;
  atl: number;
  atlDate: Date;
  sparklineIn7d?: SparklineSvgData;
  chartData: MarketCoinDataChart;
};

export type SingleCoinState = {
  selectedCurrency?: string;
  chartRequestParams: MarketCurrencyChartDataRequestParams;
  loading: boolean;
  loadingChart: boolean;
  error?: Error;
  supportedCounterCurrencies: string[];
  selectedCoinData?: CurrencyData;
  counterCurrency?: string;
};

export type State = SingleCoinState & {
  ready: boolean;
  marketData?: CurrencyData[];
  requestParams: MarketListRequestParams;
  page: number;
  endOfList: boolean;
  totalCoinsAvailable: number;
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

export type MarketItemResponse = {
  allTimeHigh: number;
  allTimeHighDate: string;
  allTimeLow: number;
  allTimeLowDate: string;
  circulatingSupply: number;
  fullyDilutedValuation: number;
  high24h: number;
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
  priceChangePercentage1y: number;
  sparkline: number[];
  ticker: string;
  totalSupply: number;
  totalVolume: number;
  updatedAt: string;
};
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

export type MarketDataApi = {
  setSupportedCoinsList: () => Promise<SupportedCoins>;
  listPaginated: (params: MarketListRequestParams) => Promise<CurrencyData[]>;
  supportedCounterCurrencies: () => Promise<string[]>;
  currencyChartData: (
    params: MarketCurrencyChartDataRequestParams,
  ) => Promise<{ [range: string]: number[][] }>;
};
