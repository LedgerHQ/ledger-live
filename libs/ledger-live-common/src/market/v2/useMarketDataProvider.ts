import { useQueries, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  fetchCurrency,
  fetchCurrencyChartData,
  fetchCurrencyData,
  fetchList,
  getSupportedCoinsList,
  supportedCounterCurrencies,
} from "../api/api";
import {
  MarketCurrencyRequestParams,
  MarketListRequestParams,
  MarketListRequestResult,
} from "../types";
import { QUERY_KEY } from "./queryKeys";
import { listSupportedCurrencies } from "../../currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useMemo } from "react";

// 1min
const REFETCH_TIME = 1 * 60000;

export function useMarketDataProvider() {
  const supportedCurrenciesInLIve = listSupportedCurrencies();

  const liveCompatibleIds: string[] = supportedCurrenciesInLIve
    .map(({ id }: CryptoCurrency) => id)
    .filter(Boolean);
  const { data: supportedCounterCurrencies } = useSupportedCounterCurrencies();
  const { data: supportedCurrencies } = useSupportedCurrencies();

  const liveCoinsList = useMemo(
    () =>
      supportedCurrencies?.filter(({ id }) => liveCompatibleIds.includes(id)).map(({ id }) => id),
    [liveCompatibleIds, supportedCurrencies],
  );

  return {
    supportedCounterCurrencies,
    supportedCurrencies,
    liveCoinsList,
  };
}

export function useCurrencyChartData({
  id,
  counterCurrency,
  ranges,
  liveCoinsList,
}: MarketCurrencyRequestParams) {
  const results = useQueries({
    queries: (ranges || []).map(range => ({
      queryKey: [QUERY_KEY.CurrencyChartData, id, counterCurrency, range],
      queryFn: () => fetchCurrencyChartData({ counterCurrency, range, id, liveCoinsList }),
      refetchInterval: REFETCH_TIME,
      staleTime: REFETCH_TIME,
    })),
  });

  return results;
}

export function useCurrencyData({
  id,
  counterCurrency,
  ranges,
  liveCoinsList,
}: MarketCurrencyRequestParams) {
  const results = useQueries({
    queries: (ranges || []).map(range => ({
      queryKey: [QUERY_KEY.CurrencyData, id, counterCurrency, range],
      queryFn: () => fetchCurrencyData({ counterCurrency, range, id, liveCoinsList }),
      refetchInterval: REFETCH_TIME,
      staleTime: REFETCH_TIME,
    })),
  });

  const resultCurrency = useSuspenseQuery({
    queryKey: [QUERY_KEY.CurrencyDataRaw, id],
    queryFn: () => fetchCurrency({ id }),
    refetchInterval: REFETCH_TIME,
    staleTime: REFETCH_TIME,
  });

  return { currencyDataByRanges: results, currencyInfo: resultCurrency };
}

export function useSupportedCounterCurrencies() {
  const { isPending, error, data, isFetching } = useQuery({
    queryKey: [QUERY_KEY.SupportedCounterCurrencies],
    queryFn: () => supportedCounterCurrencies(),
  });

  return {
    isPending,
    error,
    data,
    isFetching,
  };
}

export function useSupportedCurrencies() {
  const { isPending, error, data, isFetching } = useQuery({
    queryKey: [QUERY_KEY.SupportedCurrencies],
    queryFn: () => getSupportedCoinsList(),
  });

  return {
    isPending,
    error,
    data,
    isFetching,
  };
}

export function useMarketData(props: MarketListRequestParams): MarketListRequestResult {
  const results = useQueries({
    queries: Array.from({ length: props.page ?? 1 }, (_, i) => i + 1).map(page => ({
      queryKey: [
        QUERY_KEY.MarketData,
        { ...props, page, liveCoinsList: [], supportedCoinsList: [] },
      ],
      queryFn: () => fetchList({ ...props, page }),
      refetchInterval: REFETCH_TIME,
      staleTime: REFETCH_TIME,
    })),
    combine: results => {
      return {
        data: results.flatMap(result => result.data ?? []),
        pending: results.some(result => result.isPending),
        loading: results.some(result => result.isLoading),
        hasError: results.some(result => result.isError),
      };
    },
  });

  return results;
}
