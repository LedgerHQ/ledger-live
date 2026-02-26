import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH, ONE_DAY } from "../constants";
import {
  useGetSupportedCoinsListQuery,
  useGetSupportedCounterCurrenciesQuery,
  useGetCurrencyChartDataQuery,
} from "../state-manager/api";
import { MarketCurrencyChartDataRequestParams } from "../utils/types";

export function useMarketDataProvider() {
  const { data: supportedCounterCurrencies } = useSupportedCounterCurrencies();
  const { data: supportedCurrencies } = useSupportedCurrencies();

  return {
    supportedCounterCurrencies,
    supportedCurrencies,
  };
}

export const useCurrencyChartData = ({
  id,
  counterCurrency,
  range,
}: MarketCurrencyChartDataRequestParams) =>
  useGetCurrencyChartDataQuery(
    { id, counterCurrency, range },
    {
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    },
  );

export const useSupportedCounterCurrencies = () =>
  useGetSupportedCounterCurrenciesQuery(undefined, {
    pollingInterval: ONE_DAY,
  });

export const useSupportedCurrencies = () =>
  useGetSupportedCoinsListQuery(undefined, {
    pollingInterval: ONE_DAY,
  });
