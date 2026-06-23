import { TrendingPerformersParams } from "../utils/types";
import { useGetTrendingPerformersQuery } from "../state-manager/api";
import { REFETCH_TIME_ONE_MINUTE } from "../utils/timers";

export const useTrendingPerformers = (
  { counterCurrency, refreshRate }: TrendingPerformersParams,
  options?: { skip?: boolean },
) =>
  useGetTrendingPerformersQuery(
    { counterCurrency },
    {
      pollingInterval: REFETCH_TIME_ONE_MINUTE * Number(refreshRate),
      refetchOnReconnect: true,
      skip: options?.skip,
    },
  );
