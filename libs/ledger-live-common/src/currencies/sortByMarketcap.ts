import type { Currency } from "../types";
import { useState, useEffect } from "react";
import { makeLRUCache } from "../cache";
import api from "../countervalues/api";
import { listCryptoCurrencies, listTokens } from "../currencies";
export const sortByMarketcapV1 = <C extends Currency>(
  currencies: C[],
  tickers: string[]
): C[] => {
  const list = currencies.slice(0);
  const prependList: C[] = [];
  tickers.forEach((ticker) => {
    const item = list.find(
      (c) => !c.disableCountervalue && c.ticker === ticker
    );

    if (item) {
      list.splice(list.indexOf(item), 1);
      prependList.push(item);
    }
  });
  return prependList.concat(list);
};
// FIXME in future we would put it back in ledgerjs to be more "dynamic"
let currenciesAndTokenWithCountervaluesByTicker:
  | Map<string, Currency>
  | null
  | undefined;

function lazyLoadTickerMap() {
  if (currenciesAndTokenWithCountervaluesByTicker)
    return currenciesAndTokenWithCountervaluesByTicker;
  const m: Map<string, Currency> = new Map();
  listTokens().forEach((t) => {
    if (!t.disableCountervalue && !m.has(t.ticker)) {
      m.set(t.ticker, t);
    }
  });
  listCryptoCurrencies().forEach((c) => {
    if (!c.disableCountervalue) {
      m.set(c.ticker, c);
    }
  });
  currenciesAndTokenWithCountervaluesByTicker = m;
  return m;
}

export const sortByMarketcapV2 = <C extends Currency>(
  currencies: C[],
  tickers: string[]
): C[] => {
  const m = lazyLoadTickerMap();
  const list = currencies.slice(0);
  const prependList: C[] = [];
  tickers.forEach((ticker) => {
    const item: C | undefined = m.get(ticker) as C | undefined;

    if (item) {
      const i = list.indexOf(item);

      if (i !== -1) {
        list.splice(i, 1);
        prependList.push(item);
      }
    }
  });
  return prependList.concat(list);
};
export const sortByMarketcap: <C extends Currency>(
  currencies: C[],
  tickers: string[]
) => C[] = sortByMarketcapV2;
let marketcapTickersCache;
export const getMarketcapTickers: () => Promise<string[]> = makeLRUCache(() =>
  api.fetchMarketcapTickers().then((tickers) => {
    marketcapTickersCache = tickers;
    return tickers;
  })
);
// React style version of getMarketcapTickers
export const useMarketcapTickers = (): string[] | null | undefined => {
  const [tickers, setMarketcapTickers] = useState(marketcapTickersCache);
  useEffect(() => {
    let isMounted = true;

    getMarketcapTickers().then((data) => {
      if (isMounted) setMarketcapTickers(data);
    });

    return () => {
      isMounted = false;
    };
  }, []);
  return tickers;
};
export const currenciesByMarketcap = <C extends Currency>(
  currencies: C[]
): Promise<C[]> =>
  getMarketcapTickers().then(
    (tickers) => sortByMarketcap(currencies, tickers),
    () => currencies
  );
// React style version of currenciesByMarketcap
export const useCurrenciesByMarketcap = <C extends Currency>(
  currencies: C[]
): C[] => {
  const tickers = useMarketcapTickers();
  return tickers ? sortByMarketcap(currencies, tickers) : currencies;
};
