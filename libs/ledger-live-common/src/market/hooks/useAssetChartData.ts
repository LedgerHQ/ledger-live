import { useGetAssetChartDataQuery } from "../state-manager/api";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "../utils/timers";
import type { MarketAssetChartDataRequestParams } from "../utils/types";

export const useAssetChartData = (
  { id, counterCurrency, range }: MarketAssetChartDataRequestParams,
  options?: { skip?: boolean },
) =>
  useGetAssetChartDataQuery(
    { id, counterCurrency, range },
    {
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      skip: options?.skip,
    },
  );
