import { fetchMarketPerformers } from "../api/api";
import { MarketItemResponse, MarketPerformersParams } from "../types";
import { QUERY_KEY } from "./queryKeys";
import { useQuery } from "@tanstack/react-query";
import { formatPerformer } from "../utils/currencyFormatter";
import { REFETCH_TIME_ONE_MINUTE } from "../utils/timers";

export function useMarketPerformers({
  counterCurrency,
  range,
  limit = 5,
  top = 50,
  sort,
  supported,
  refreshRate,
}: MarketPerformersParams) {
  const { isPending, isError, data, isFetching, isLoading } = useQuery({
    queryKey: [QUERY_KEY.MarketPerformers, counterCurrency, range, sort],
    queryFn: () => fetchMarketPerformers({ counterCurrency, range, limit, top, sort, supported }),
    refetchInterval: REFETCH_TIME_ONE_MINUTE * Number(refreshRate),
    select: data => data.map((currency: MarketItemResponse) => formatPerformer(currency)),
  });

  return {
    isPending,
    isError,
    isLoading,
    data,
    isFetching,
  };
}
