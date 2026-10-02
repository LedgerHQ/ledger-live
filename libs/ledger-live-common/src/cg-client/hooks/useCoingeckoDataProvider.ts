import { ONE_DAY } from "../constants";
import { useGetSupportedCounterCurrenciesQuery } from "../state-manager/api";

export function useMarketDataProvider() {
  const { data: supportedCounterCurrencies } = useSupportedCounterCurrencies();

  return {
    supportedCounterCurrencies,
  };
}

export const useSupportedCounterCurrencies = () =>
  useGetSupportedCounterCurrenciesQuery(undefined, {
    pollingInterval: ONE_DAY,
  });
