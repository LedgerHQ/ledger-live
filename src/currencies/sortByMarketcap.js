// @flow
import type { Currency } from "../types";
// $FlowFixMe to be figured out
import { useState, useEffect } from "react";
import { makeLRUCache } from "../cache";
import api from "../countervalues/api";

export const sortByMarketcap = <C: Currency>(
  currencies: C[],
  tickers: string[]
): C[] => {
  const list = currencies.slice(0);
  const prependList = [];
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

let marketcapTickersCache;
export const getMarketcapTickers: () => Promise<string[]> = makeLRUCache(() =>
  api.fetchMarketcapTickers().then((tickers) => {
    marketcapTickersCache = tickers;
    return tickers;
  })
);

// React style version of getMarketcapTickers
export const useMarketcapTickers = (): ?(string[]) => {
  const [tickers, setMarketcapTickers] = useState(marketcapTickersCache);
  useEffect(() => {
    getMarketcapTickers().then(setMarketcapTickers);
  }, []);
  return tickers;
};

export const currenciesByMarketcap = <C: Currency>(
  currencies: C[]
): Promise<C[]> =>
  getMarketcapTickers().then(
    (tickers) => sortByMarketcap(currencies, tickers),
    () => currencies
  );

// React style version of currenciesByMarketcap
export const useCurrenciesByMarketcap = <C: Currency>(currencies: C[]): C[] => {
  const tickers = useMarketcapTickers();
  return tickers ? sortByMarketcap(currencies, tickers) : currencies;
};
