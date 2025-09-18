import { useQueries } from "@tanstack/react-query";
import { fetchCurrency } from "../api";
import { QUERY_KEY } from "../utils/queryKeys";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "../utils/timers";
import { MarketItemResponse, CurrencyData } from "../utils/types";
import { format } from "../utils/currencyFormatter";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";

const cryptoCurrenciesList = [...listCryptoCurrencies()];

type UseLargeMoverCurrenciesParams = {
  ids: string[];
  counterCurrency: string;
};

export const useLargeMoverCurrencies = ({
  ids,
  counterCurrency,
}: UseLargeMoverCurrenciesParams) => {
  const currencyQueries = useQueries({
    queries: ids.map(id => ({
      queryKey: [QUERY_KEY.CurrencyDataRaw, id, counterCurrency],
      queryFn: () => fetchCurrency({ id, counterCurrency }),
      refetchInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      staleTime: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      select: (data: MarketItemResponse) => format(data, cryptoCurrenciesList),
    })),
  });

  return ids.map((id, index) => ({
    id,
    data: currencyQueries[index]?.data as CurrencyData | undefined,
    isLoading: currencyQueries[index]?.isLoading || false,
    isError: currencyQueries[index]?.isError || false,
  }));
};
