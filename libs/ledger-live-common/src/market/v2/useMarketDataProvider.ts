import { useQueries, useQuery } from "@tanstack/react-query";
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
import { listCryptoCurrencies, listSupportedCurrencies, listTokens } from "../../currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useMemo } from "react";

import { format } from "../utils/currencyFormatter";

const cryptoCurrenciesList = [...listCryptoCurrencies(), ...listTokens()];

const REFETCH_TIME = 2 * 60000;

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

export const useCurrencyChartData = ({
  id,
  counterCurrency,
  ranges,
}: MarketCurrencyRequestParams) =>
  useQueries({
    queries: (ranges || []).map(range => ({
      queryKey: [QUERY_KEY.CurrencyChartData, id, counterCurrency, range],
      queryFn: () => fetchCurrencyChartData({ counterCurrency, range, id }),
      refetchInterval: REFETCH_TIME,
      staleTime: REFETCH_TIME,
    })),
  });

export function useCurrencyData({ id, counterCurrency, ranges }: MarketCurrencyRequestParams) {
  const results = useQueries({
    queries: (ranges || []).map(range => ({
      queryKey: [QUERY_KEY.CurrencyData, id, counterCurrency, range],
      queryFn: async () => fetchCurrencyData({ counterCurrency, range, id }),
      refetchInterval: REFETCH_TIME,
      staleTime: REFETCH_TIME,
      select: data => format(data, range, cryptoCurrenciesList),
    })),
  });

  const resultCurrency = useQuery({
    queryKey: [QUERY_KEY.CurrencyDataRaw, id],
    queryFn: () => fetchCurrency({ id }),
    refetchInterval: REFETCH_TIME,
    staleTime: REFETCH_TIME,
    select: data => format(data, "24h", cryptoCurrenciesList),
  });

  return { currencyDataByRanges: results, currencyInfo: resultCurrency };
}

export const useSupportedCounterCurrencies = () =>
  useQuery({
    queryKey: [QUERY_KEY.SupportedCounterCurrencies],
    queryFn: () => supportedCounterCurrencies(),
  });

export const useSupportedCurrencies = () =>
  useQuery({
    queryKey: [QUERY_KEY.SupportedCurrencies],
    queryFn: () => getSupportedCoinsList(),
  });

export function useMarketData(props: MarketListRequestParams): MarketListRequestResult {
  return useQueries({
    queries: Array.from({ length: props.page ?? 1 }, (_, i) => i + 1).map(page => ({
      queryKey: [
        QUERY_KEY.MarketData,
        { ...props, page, liveCoinsList: [], supportedCoinsList: [] },
      ],
      queryFn: () => fetchList({ ...props, page }),
      refetchInterval: props.refreshTime ?? REFETCH_TIME,
      staleTime: props.refreshTime ?? REFETCH_TIME,
    })),
    combine: results => {
      return {
        data: results.flatMap(result => result.data ?? []),
        isPending: results.some(result => result.isPending),
        isLoading: results.some(result => result.isLoading),
        isError: results.some(result => result.isError),
      };
    },
  });
}
