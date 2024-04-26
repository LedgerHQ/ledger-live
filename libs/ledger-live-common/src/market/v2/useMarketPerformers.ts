import { fetchMarketPerformers } from "../api/api";
import { MarketItemPerformer, MarketItemResponse, MarketPerformersParams } from "../types";
import { QUERY_KEY } from "./queryKeys";
import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { formatPerformer } from "../utils/currencyFormatter";
import { REFETCH_TIME_ONE_MINUTE } from "./timers";

export const useMarketPerformers = ({
  counterCurrency,
  range,
  limit = 5,
  top = 50,
  sort,
  supported,
  refreshRate,
}: MarketPerformersParams): UseQueryResult<MarketItemPerformer[], Error> =>
  useQuery({
    queryKey: [QUERY_KEY.MarketPerformers, counterCurrency, range, sort],
    queryFn: () => fetchMarketPerformers({ counterCurrency, range, limit, top, sort, supported }),
    refetchInterval: REFETCH_TIME_ONE_MINUTE * Number(refreshRate),
    staleTime: REFETCH_TIME_ONE_MINUTE * Number(refreshRate),
    select: data => data.map((currency: MarketItemResponse) => formatPerformer(currency)),
  });
