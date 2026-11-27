import { useGetAssetChartDataQuery, toMarketChartRange } from "@domain/api-market-chart";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "../utils/timers";
import type { MarketAssetChartDataRequestParams } from "../utils/types";

export type UseAssetChartDataOptions = {
  skip?: boolean;
  pollingInterval?: number;
};

const DEFAULT_CHART_POLLING_INTERVAL = REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH;

export const useAssetChartData = (
  { id, counterCurrency, range }: MarketAssetChartDataRequestParams,
  options?: UseAssetChartDataOptions,
) =>
  useGetAssetChartDataQuery(
    // An unknown range falls back to the endpoint default and a missing counter currency is omitted from the query.
    {
      id,
      counterCurrency: counterCurrency ?? "",
      range: toMarketChartRange(range),
    },
    {
      pollingInterval: options?.pollingInterval ?? DEFAULT_CHART_POLLING_INTERVAL,
      skip: options?.skip,
    },
  );
