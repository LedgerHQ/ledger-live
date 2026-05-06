import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useGetCurrencyDataQuery } from "@ledgerhq/live-common/market/state-manager/marketApi";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "@ledgerhq/live-common/market/utils/timers";
import { useSelector } from "~/context/hooks";
import { marketParamsSelector } from "~/reducers/market";

export function useAssetMarketData(currency: CryptoCurrency | undefined) {
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
