import { UseQueryResult, useQueries, useQuery } from "@tanstack/react-query";
import {
  fetchCurrency,
  fetchCurrencyChartData,
  fetchList,
  getSupportedCoinsList,
  supportedCounterCurrencies,
} from "../api";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { listTokens } from "@ledgerhq/cryptoassets/tokens";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

import { useMemo } from "react";
import { listSupportedCurrencies } from "../../currencies";
import { currencyFormatter, format } from "../utils/currencyFormatter";
import { QUERY_KEY } from "../utils/queryKeys";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH, ONE_DAY } from "../utils/timers";
import {
  MarketCurrencyRequestParams,
  MarketListRequestParams,
  CurrencyData,
  HashMapBody,
  MarketItemResponse,
  MarketListRequestResult,
} from "../utils/types";

const cryptoCurrenciesList = [...listCryptoCurrencies(), ...listTokens()];

export function useMarketDataProvider() {
  const supportedCurrenciesInLIve = listSupportedCurrencies();

  const liveCompatibleIds: string[] = supportedCurrenciesInLIve
    .map(({ id }: CryptoCurrency) => id)
    .filter(Boolean);
  const { data: supportedCounterCurrencies } = useSupportedCounterCurrencies();
  const { data: supportedCurrencies } = useSupportedCurrencies();

  const liveCoinsList = useMemo(
    () =>
      (supportedCurrencies || [])
        ?.filter(({ id }) => liveCompatibleIds.includes(id))
        .map(({ id }) => id),
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

export const useCurrencyData = ({ id, counterCurrency, name }: MarketCurrencyRequestParams) =>
  useQuery({
    queryKey: [QUERY_KEY.CurrencyDataRaw, id, name, counterCurrency],
    queryFn: () => fetchCurrency({ id, counterCurrency, name }),
    refetchInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    staleTime: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    select: data => format(data, cryptoCurrenciesList),
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
  return useQueries({
    queries: Array.from({ length: props.page ?? 1 }, (_, i) => i).map(page => ({
      queryKey: [
        QUERY_KEY.MarketData,
        page,
        {
          counterCurrency: props.counterCurrency,
          ...(props.search && props.search?.length > 1 && { search: props.search }),
          ...(props.starred && props.starred?.length >= 1 && { starred: props.starred }),
          ...(props.liveCoinsList &&
            props.liveCoinsList?.length >= 1 && { liveCoinsList: props.liveCoinsList }),
        },
      ],
      queryFn: () => fetchList({ ...props, page }),
      select: (data: MarketItemResponse[]) => ({
        formattedData: currencyFormatter(data, cryptoCurrenciesList),
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

export function useStarredCurrencies(props: MarketListRequestParams): MarketListRequestResult {
  return useQueries({
    queries: Array.from({ length: props.starred?.length ?? 1 }, (_, i) => i).map((name, index) => ({
      queryKey: [QUERY_KEY.CurrencyDataRaw, props.counterCurrency, name],
      queryFn: () => fetchCurrency({ ...props }),
      select: (data: MarketItemResponse) => ({
        formattedData: [format(data, cryptoCurrenciesList)],
        page: index,
      }),
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      enabled: Boolean(props.starred?.length),
    })),
    combine: combineMarketData,
  });
}
