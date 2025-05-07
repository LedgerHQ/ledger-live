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
  currencies: {
    id: string;
    data?: CurrencyData;
    chartData?: MarketCoinDataChart;
    isLoading: boolean;
    isError: boolean;
  }[];
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

  const currencyQueryMap = Object.fromEntries(ids.map((id, index) => [id, currencyQueries[index]]));

  const chartQueryMap = Object.fromEntries(ids.map((id, index) => [id, chartQueries[index]]));

  const currencies = ids.map(id => {
    const currencyQuery = currencyQueryMap[id];
    const chartQuery = chartQueryMap[id];

    return {
      id,
      data: currencyQuery?.data,
      chartData: chartQuery?.data,
      isLoading: currencyQuery?.isLoading || chartQuery?.isLoading || false,
      isError: currencyQuery?.isError || chartQuery?.isError || false,
    };
  });

  return { currencies };
};
