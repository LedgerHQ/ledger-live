import { useMarketcapIds } from "@ledgerhq/live-countervalues-react";
import { sortCurrenciesByIds } from "./sortByMarketcap";
import type { Currency } from "@ledgerhq/types-cryptoassets";

/**
 * Sorts the given currencies by marketcap.
 */
export const useCurrenciesByMarketcap = <C extends Currency>(currencies: C[]): C[] => {
  const ids = useMarketcapIds();
  return ids ? sortCurrenciesByIds(currencies, ids) : currencies;
};
