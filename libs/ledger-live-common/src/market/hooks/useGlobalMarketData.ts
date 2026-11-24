import {
  useGetGlobalMarketDataQuery,
  type GlobalMarketDataRequestParams,
} from "@domain/api-market-index-global";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "../utils/timers";

export const useGlobalMarketData = ({ counterCurrency }: GlobalMarketDataRequestParams) =>
  useGetGlobalMarketDataQuery(
    { counterCurrency },
    {
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    },
  );
