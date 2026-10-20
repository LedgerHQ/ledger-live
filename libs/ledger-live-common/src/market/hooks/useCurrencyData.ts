import { useGetCurrencyDataQuery } from "../state-manager/api";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "../utils/timers";
import type { MarketCurrencyRequestParams } from "../utils/types";

export const useCurrencyData = (
  { id, ledgerIds, counterCurrency }: MarketCurrencyRequestParams,
  options?: { skip?: boolean },
) =>
  useGetCurrencyDataQuery(
    { id, ledgerIds, counterCurrency },
    {
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      skip: options?.skip,
    },
  );
