import { sortCurrenciesByIds, fetchMarketcapIds, getMarketcapIdsSync } from "./sortByMarketcap";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { useEffect, useState } from "react";

// React style version of getMarketcapIds
export const useMarketcapIds = (): string[] | null | undefined => {
  const [ids, setMarketcapIds] = useState(getMarketcapIdsSync());
  useEffect(() => {
    let isMounted = true;
    fetchMarketcapIds().then(data => {
      if (isMounted) setMarketcapIds(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);
  return ids;
};

// React style version of currenciesByMarketcap
export const useCurrenciesByMarketcap = <C extends Currency>(currencies: C[]): C[] => {
  const ids = useMarketcapIds();
  return ids ? sortCurrenciesByIds(currencies, ids) : currencies;
};
