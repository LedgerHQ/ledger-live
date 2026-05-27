import { ONE_DAY } from "../constants";
import {
  useGetSupportedCoinsListQuery,
  useGetSupportedCounterCurrenciesQuery,
} from "../state-manager/api";

export function useMarketDataProvider() {
  const { data: supportedCounterCurrencies } = useSupportedCounterCurrencies();
  const { data: supportedCurrencies } = useSupportedCurrencies();

  return {
    supportedCounterCurrencies,
    supportedCurrencies,
  };
}

export const useSupportedCounterCurrencies = () =>
  useGetSupportedCounterCurrenciesQuery(undefined, {
    pollingInterval: ONE_DAY,
  });

export const useSupportedCurrencies = () =>
  useGetSupportedCoinsListQuery(undefined, {
    pollingInterval: ONE_DAY,
  });
