import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { RefetchOptions, QueryObserverResult } from "@tanstack/react-query";
import { PortfolioRange } from "@ledgerhq/types-live";

export type MarketCoin = {
  id: string;
  name: string;
  symbol: string;
};

export type SupportedCoins = MarketCoin[];

export type MarketListRequestParams = {
  counterCurrency?: string;
  ids?: string[];
  starred?: string[];
  page?: number;
  limit?: number;
  range?: string;
  orderBy?: string;
  order?: string;
  search?: string;
  lastRequestTime?: Date;
  sparkline?: boolean;
  liveCompatible?: boolean;
  top100?: boolean;
  supportedCoinsList?: SupportedCoins;
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
  priceChangePercentage: number;
  marketCapChangePercentage24h: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  ath: number;
  athDate: Date;
  atl: number;
  atlDate: Date;
  sparklineIn7d?: SparklineSvgData;
  chartData: Record<string, [number, number][]>;
};

export type RawCurrencyData = {
  [x: string]: any;
  id: string;
  name: string;
  image?: string | { thumb: string; small: string; large: string };
  ["market_cap"]: number;
  ["market_cap_rank"]: number;
  ["total_volume"]: number;
  ["high_24h"]: number;
  ["low_24h"]: number;
  symbol: string;
  ["current_price"]: number;
  ["market_cap_change_percentage_24h"]: number;
  ["circulating_supply"]: number;
  ["total_supply"]: number;
  ["max_supply"]: number;
  ath: number;
  ["ath_date"]: Date;
  atl: number;
  ["atl_date"]: Date;
  ["sparkline_in_7d"]: { price: any };
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
  id: string;
  ledgerIds: string[];
  ticker: string;
  name: string;
  image: string;
  marketCap: number;
  marketCapRank: number;
  fullyDilutedValuation: number;
  totalVolume: number;
  high24h: number;
  low24h: number;
  price: number;
  priceChange24h: number;
  priceChangePercentage1h: number;
  priceChangePercentage24h: number;
  priceChangePercentage7d: number;
  priceChangePercentage30d: number;
  priceChangePercentage1y: number;
  marketCapChange24h: number;
  marketCapChangePercentage24h: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  allTimeHigh: number;
  allTimeLow: number;
  allTimeHighDate: string;
  allTimeLowDate: string;
  sparkline: number[];
  updatedAt: string;
};
export type MarketItemPerformer = {
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
