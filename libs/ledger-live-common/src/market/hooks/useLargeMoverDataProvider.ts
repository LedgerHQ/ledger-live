import { useQueries } from "@tanstack/react-query";
import { fetchCurrency, fetchCurrencyChartData } from "../api";
import { QUERY_KEY } from "../utils/queryKeys";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "../utils/timers";
import { CurrencyData, MarketCoinDataChart, MarketItemResponse } from "../utils/types";
import { format } from "../utils/currencyFormatter";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";

const cryptoCurrenciesList = [...listCryptoCurrencies()];

type UseLargeMoverDataProviderParams = {
  ids: string[];
  counterCurrency: string;
  range: string;
};

export const useLargeMoverDataProvider = ({
  ids,
  counterCurrency,
  range,
}: UseLargeMoverDataProviderParams): {
  data: CurrencyData[];
  isLoading: boolean;
  isError: boolean;
} => {
  const currencyQueries = useQueries({
    queries: ids.map(id => ({
      queryKey: [QUERY_KEY.CurrencyDataRaw, id, counterCurrency],
      queryFn: () => fetchCurrency({ id, counterCurrency }),
      refetchInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      staleTime: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      select: (data: MarketItemResponse) => format(data, cryptoCurrenciesList),
    })),
  });

  const chartQueries = useQueries({
    queries: ids.map(id => ({
      queryKey: [QUERY_KEY.CurrencyChartData, id, counterCurrency, range],
      queryFn: () => fetchCurrencyChartData({ id, counterCurrency, range }),
      refetchInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      staleTime: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    })),
  });

  const isLoading =
    currencyQueries.some(query => query.isLoading) || chartQueries.some(query => query.isLoading);

  const isError =
    currencyQueries.some(query => query.isError) || chartQueries.some(query => query.isError);

  const data = ids
    .map((id, index) => {
      const currencyData = currencyQueries[index]?.data;
      const chartData = chartQueries[index]?.data;

      if (!currencyData) return null;

      return {
        ...currencyData,
        chartData: chartData as MarketCoinDataChart | undefined,
      };
    })
    .filter(Boolean) as CurrencyData[];

  return {
    data,
    isLoading,
    isError,
  };
};
