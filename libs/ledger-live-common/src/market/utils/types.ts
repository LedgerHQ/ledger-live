import { PortfolioRange } from "@ledgerhq/types-live";
import type { MarketItemResponse } from "@domain/api-market-currency";
import type { MarketCurrency } from "@domain/entity-market-currency";

export type ChartDataPoint = [number, number];
export type MarketCoinDataChart = Record<string, Array<ChartDataPoint>>;

import { Order } from "@domain/entity-market-currency";

export { Order };

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

export type { MarketCurrencyRequestParams } from "@domain/api-market-currency";

export type MarketAssetChartDataRequestParams = MarketCounterValueParams & {
  range?: string;
};

export { KeysPriceChange } from "@domain/entity-market-currency";

export type MarketCurrencyData = MarketCurrency;

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

export type { MarketItemResponse };

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
