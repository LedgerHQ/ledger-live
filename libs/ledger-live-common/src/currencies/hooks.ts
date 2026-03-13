import { useGetCounterValueIdsSortedByMarketCapQuery } from "../counterValues/state-manager/api";
import { sortCurrenciesByIds } from "./sortByMarketcap";
import type { Currency } from "@ledgerhq/types-cryptoassets";

/**
 * Sorts the given currencies by marketcap.
 */
export const useCurrenciesByMarketcap = <C extends Currency>(currencies: C[]): C[] => {
  const { data: ids } = useGetCounterValueIdsSortedByMarketCapQuery();
  return ids ? sortCurrenciesByIds(currencies, ids) : currencies;
};
