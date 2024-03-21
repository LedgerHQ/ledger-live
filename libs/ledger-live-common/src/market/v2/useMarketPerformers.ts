import { fetchMarketPerformers } from "../api/api";
import { MarketPerformersParams } from "../types";
import { QUERY_KEY } from "./queryKeys";
import { useQuery } from "@tanstack/react-query";

const NB_MINUTES = 2;

export function useMarketPerformers({
  counterCurrency,
  range,
  limit = 5,
  top = 50,
  sort,
  supported,
}: MarketPerformersParams) {
  const { isPending, isError, data, isFetching, isLoading } = useQuery({
    queryKey: [QUERY_KEY.MarketPerformers, counterCurrency, range, sort],
    queryFn: () => fetchMarketPerformers({ counterCurrency, range, limit, top, sort, supported }),
    refetchInterval: 60 * 1000 * NB_MINUTES,
  });

  return {
    isPending,
    isError,
    isLoading,
    data,
    isFetching,
  };
}
