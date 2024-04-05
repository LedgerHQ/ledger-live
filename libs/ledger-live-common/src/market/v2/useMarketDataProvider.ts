import { UseQueryResult, useQueries, useQuery } from "@tanstack/react-query";
import {
  fetchCurrency,
  fetchCurrencyChartData,
  fetchCurrencyData,
  fetchList,
  getSupportedCoinsList,
  supportedCounterCurrencies,
} from "../api/api";
import {
  CurrencyData,
  HashMapBody,
  MarketCurrencyRequestParams,
  MarketListRequestParams,
  MarketListRequestResult,
  RawCurrencyData,
} from "../types";
import { QUERY_KEY } from "./queryKeys";
import { listCryptoCurrencies, listSupportedCurrencies, listTokens } from "../../currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useMemo } from "react";

import { currencyFormatter, format } from "../utils/currencyFormatter";

const cryptoCurrenciesList = [...listCryptoCurrencies(), ...listTokens()];

const REFETCH_TIME_ONE_MINUTE = 60 * 1000;

const BASIC_REFETCH = 3; // nb minutes

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

export const useCurrencyChartData = ({ id, counterCurrency, range }: MarketCurrencyRequestParams) =>
  useQuery({
    queryKey: [QUERY_KEY.CurrencyChartData, id, counterCurrency, range],
    queryFn: () => fetchCurrencyChartData({ counterCurrency, range, id }),
    refetchInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    staleTime: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
  });

export function useCurrencyData({ id, counterCurrency, range }: MarketCurrencyRequestParams) {
  const resultCurrencyData = useQuery({
    queryKey: [QUERY_KEY.CurrencyData, id, counterCurrency, range],
    queryFn: () => fetchCurrencyData({ counterCurrency, range, id }),
    refetchInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    staleTime: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    select: (data: RawCurrencyData) => format(data, range ?? "24h", cryptoCurrenciesList),
  });

  const resultCurrency = useQuery({
    queryKey: [QUERY_KEY.CurrencyDataRaw, id],
    queryFn: () => fetchCurrency({ id }),
    refetchInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    staleTime: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    select: data => format(data, "24h", cryptoCurrenciesList),
  });

  return { currencyData: resultCurrencyData, currencyInfo: resultCurrency };
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
      select: (data: RawCurrencyData[]) => ({
        formattedData: currencyFormatter(data, props.range ?? "24h", cryptoCurrenciesList),
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
      formattedData: CurrencyData[];
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
    isLoading: results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
    cachedMetadataMap: hashMap,
  };
}
