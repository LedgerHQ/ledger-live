import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

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
  refreshTime?: number;
};

export type MarketListRequestResult = {
  data: CurrencyData[];
  isPending: boolean;
  isLoading: boolean;
  isError: boolean;
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

export type MarketDataApi = {
  setSupportedCoinsList: () => Promise<SupportedCoins>;
  listPaginated: (params: MarketListRequestParams) => Promise<CurrencyData[]>;
  supportedCounterCurrencies: () => Promise<string[]>;
  currencyChartData: (
    params: MarketCurrencyChartDataRequestParams,
  ) => Promise<{ [range: string]: number[][] }>;
};
