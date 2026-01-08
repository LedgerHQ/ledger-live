import { UseQueryResult, useQueries, useQuery } from "@tanstack/react-query";
import {
  fetchCurrency,
  fetchCurrencyChartData,
  fetchList,
  getSupportedCoinsList,
  supportedCounterCurrencies,
} from "../api";
import { currencyFormatter, format } from "../utils/currencyFormatter";
import { QUERY_KEY } from "../utils/queryKeys";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH, ONE_DAY } from "../utils/timers";
import {
  MarketCurrencyRequestParams,
  MarketListRequestParams,
  MarketCurrencyData,
  HashMapBody,
  MarketItemResponse,
  MarketListRequestResult,
  Order,
} from "../utils/types";

export function useMarketDataProvider() {
  const { data: supportedCounterCurrencies } = useSupportedCounterCurrencies();
  const { data: supportedCurrencies } = useSupportedCurrencies();

  return {
    supportedCounterCurrencies,
    supportedCurrencies,
  };
}

export const useCurrencyChartData = ({ id, counterCurrency, range }: MarketCurrencyRequestParams) =>
  useQuery({
    queryKey: [QUERY_KEY.CurrencyChartData, id, counterCurrency, range],
    queryFn: () => fetchCurrencyChartData({ counterCurrency, range, id }),
    refetchInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    staleTime: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
  });

export const useCurrencyData = ({ id, counterCurrency }: MarketCurrencyRequestParams) =>
  useQuery({
    queryKey: [QUERY_KEY.CurrencyDataRaw, id, counterCurrency],
    queryFn: () => fetchCurrency({ id, counterCurrency }),
    refetchInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    staleTime: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    select: data => format(data),
  });

export const useSupportedCounterCurrencies = () =>
  useQuery({
    queryKey: [QUERY_KEY.SupportedCounterCurrencies],
    queryFn: () => supportedCounterCurrencies(),
    refetchOnWindowFocus: true,
    staleTime: ONE_DAY,
  });

export const useSupportedCurrencies = () =>
  useQuery({
    queryKey: [QUERY_KEY.SupportedCurrencies],
    queryFn: () => getSupportedCoinsList(),
    refetchOnWindowFocus: true,
    staleTime: ONE_DAY,
  });

export function useMarketData(props: MarketListRequestParams): MarketListRequestResult {
  const search = props.search?.toLowerCase() ?? "";
  return useQueries({
    queries: Array.from({ length: props.page ?? 1 }, (_, i) => i).map(page => ({
      queryKey: [
        QUERY_KEY.MarketData,
        page,
        props.order,
        {
          counterCurrency: props.counterCurrency,
          ...(props.search && props.search?.length >= 2 && { search: search }),
          ...(props.starred && props.starred?.length >= 1 && { starred: props.starred }),
          ...(props.liveCompatible && { liveCompatible: props.liveCompatible }),
          ...(props.order &&
            [Order.topLosers, Order.topGainers].includes(props.order) && { range: props.range }),
        },
      ],
      queryFn: () => fetchList({ ...props, page, search }),
      select: (data: MarketItemResponse[]) => ({
        formattedData: currencyFormatter(data),
        page,
      }),
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    })),
    combine: combineMarketData,
  });
}

function combineMarketData(
  results: UseQueryResult<
    {
      formattedData: MarketCurrencyData[];
      page: number;
    },
    Error
  >[],
) {
  const hashMap = new Map<string, HashMapBody>();

  results.forEach(result => {
    if (result.data) {
      hashMap.set(String(result.data.page), {
        updatedAt: result.dataUpdatedAt,
        refetch: result.refetch,
      });
    }
  });

  return {
    data: results.flatMap(result => result.data?.formattedData ?? []),
    isPending: results.some(result => result.isPending),
    isFetching: results.some(result => result.isFetching),
    isLoading: results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
    cachedMetadataMap: hashMap,
  };
}
