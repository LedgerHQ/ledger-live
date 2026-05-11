import { useGetCurrencyDataQuery } from "@ledgerhq/live-common/market/state-manager/marketApi";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "@ledgerhq/live-common/market/utils/timers";
import { useSelector } from "~/context/hooks";
import { marketParamsSelector } from "~/reducers/market";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";

export function useAssetMarketData(currency: AssetDetailCurrencyProps) {
  const marketParams = useSelector(marketParamsSelector);
  const { counterCurrency = "usd" } = marketParams;

  const { data, isFetching, isError } = useGetCurrencyDataQuery(
    { id: currency?.id ?? "", counterCurrency },
    {
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      skip: !currency?.id,
    },
  );

  return {
    marketCurrency: data,
    counterCurrency,
    isLoading: isFetching,
    isError,
  };
}
