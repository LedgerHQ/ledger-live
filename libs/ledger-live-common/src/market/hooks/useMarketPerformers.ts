import { MarketPerformersParams } from "../utils/types";
import { useGetMarketPerformersQuery } from "../state-manager/api";
import { REFETCH_TIME_ONE_MINUTE } from "../utils/timers";

export const useMarketPerformers = ({
  counterCurrency,
  range,
  limit = 5,
  top = 50,
  sort,
  supported,
  refreshRate,
}: MarketPerformersParams) =>
  useGetMarketPerformersQuery(
    { counterCurrency, range, limit, top, sort, supported },
    {
      pollingInterval: REFETCH_TIME_ONE_MINUTE * Number(refreshRate),
      refetchOnReconnect: true,
    },
  );
