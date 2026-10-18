import { useGetGlobalMarketDataQuery } from "../state-manager/api";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "../utils/timers";
import type { GlobalMarketDataRequestParams } from "../state-manager/types";

export const useGlobalMarketData = ({ counterCurrency }: GlobalMarketDataRequestParams) =>
  useGetGlobalMarketDataQuery(
    { counterCurrency },
    {
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    },
  );
