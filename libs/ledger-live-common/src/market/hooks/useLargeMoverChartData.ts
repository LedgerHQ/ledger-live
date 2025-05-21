import { useQueries } from "@tanstack/react-query";
import { fetchCurrencyChartData } from "../api";
import { QUERY_KEY } from "../utils/queryKeys";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "../utils/timers";
import { MarketCoinDataChart } from "../utils/types";

type UseLargeMoverChartDataParams = {
  ids: string[];
  counterCurrency: string;
  range: string;
};

export const useLargeMoverChartData = ({
  ids,
  counterCurrency,
  range,
}: UseLargeMoverChartDataParams) => {
  const chartQueries = useQueries({
    queries: ids.map(id => ({
      queryKey: [QUERY_KEY.CurrencyChartData, id, counterCurrency, range],
      queryFn: () => fetchCurrencyChartData({ id, counterCurrency, range }),
      refetchInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      staleTime: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    })),
  });

  const loadingChart = chartQueries.some(query => query.isLoading);
  const errorChart = chartQueries.every(query => query.isError);

  const chartDataArray = ids.map((id, index) => ({
    idChartData: id,
    chartData: chartQueries[index]?.data as MarketCoinDataChart | undefined,
    isLoading: chartQueries[index]?.isLoading || false,
    isError: chartQueries[index]?.isError || false,
  }));

  return { chartDataArray, loadingChart, errorChart };
};
