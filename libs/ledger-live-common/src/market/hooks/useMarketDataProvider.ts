import { UseQueryResult, useQueries, useQuery } from "@tanstack/react-query";
import {
  fetchCurrency,
  fetchCurrencyChartData,
  fetchList,
  getSupportedCoinsList,
  supportedCounterCurrencies,
} from "../api";
import { useDaDaCurrencies } from "./useDaDaCurrencies";
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
  Order,
} from "../utils/types";

export function useMarketDataProvider(params: { product: "llm" | "lld"; version: string }) {
  const supportedCurrenciesInLIve = listSupportedCurrencies();
  const { data: dadaCurrencies } = useDaDaCurrencies({
    product: params.product,
    version: params.version,
  });

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
    cryptoCurrenciesList: dadaCurrencies || [], // Provide DaDa currencies for backward compatibility
  };
}

export const useCurrencyChartData = ({ id, counterCurrency, range }: MarketCurrencyRequestParams) =>
  useQuery({
    queryKey: [QUERY_KEY.CurrencyChartData, id, counterCurrency, range],
    queryFn: () => fetchCurrencyChartData({ counterCurrency, range, id }),
    refetchInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    staleTime: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
  });

export const useCurrencyData = ({
  id,
  counterCurrency,
  product,
  version,
}: MarketCurrencyRequestParams & { product: "llm" | "lld"; version: string }) => {
  const { cryptoCurrenciesList } = useMarketDataProvider({ product, version });

  return useQuery({
    queryKey: [QUERY_KEY.CurrencyDataRaw, id, counterCurrency],
    queryFn: () => fetchCurrency({ id, counterCurrency }),
    refetchInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    staleTime: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    select: data => format(data, cryptoCurrenciesList),
    enabled: cryptoCurrenciesList.length > 0, // Wait for DaDa data to load
  });
};

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

export function useMarketData(
  props: MarketListRequestParams & { product: "llm" | "lld"; version: string },
): MarketListRequestResult {
  const search = props.search?.toLowerCase() ?? "";
  const { cryptoCurrenciesList } = useMarketDataProvider({
    product: props.product,
    version: props.version,
  });

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
          ...(props.liveCoinsList &&
            props.liveCoinsList?.length >= 1 && { liveCoinsList: props.liveCoinsList }),
          ...(props.order &&
            [Order.topLosers, Order.topGainers].includes(props.order) && { range: props.range }),
        },
      ],
      queryFn: () => fetchList({ ...props, page, search }),
      select: (data: MarketItemResponse[]) => ({
        formattedData: currencyFormatter(data, cryptoCurrenciesList),
        page,
      }),
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      enabled: cryptoCurrenciesList.length > 0, // Wait for DaDa data to load
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
