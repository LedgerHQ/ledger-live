import { useGetAssetChartDataQuery } from "../state-manager/api";
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
    { id, counterCurrency, range },
    {
      pollingInterval: options?.pollingInterval ?? DEFAULT_CHART_POLLING_INTERVAL,
      skip: options?.skip,
    },
  );
