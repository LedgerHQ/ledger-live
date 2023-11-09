import { listCryptoCurrencies } from "@ledgerhq/coin-framework/currencies/index";
import { listTokens } from "@ledgerhq/cryptoassets";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { useEffect, useState } from "react";
import api from "../countervalues/api";

// FIXME in future we would put it back in ledgerjs to be more "dynamic"
let currenciesAndTokenWithCountervaluesByTicker: Map<string, Currency> | null | undefined;

function lazyLoadTickerMap() {
  if (currenciesAndTokenWithCountervaluesByTicker)
    return currenciesAndTokenWithCountervaluesByTicker;
  const m: Map<string, Currency> = new Map();
  listTokens().forEach(t => {
    if (!t.disableCountervalue && !m.has(t.ticker)) {
      m.set(t.ticker, t);
    }
  });
  listCryptoCurrencies().forEach(c => {
    if (
      !c.disableCountervalue &&
      // FIXME Avoid duplicates & override if the already set currency is a token
      // E.g. 'Binance-Peg Ethereum Token' has an 'ETH' ticker
      (!m.has(c.ticker) || m.get(c.ticker)?.type !== "CryptoCurrency")
    ) {
      m.set(c.ticker, c);
    }
  });
  currenciesAndTokenWithCountervaluesByTicker = m;
  return m;
}

function getCurrencyId(currency: Currency): string {
  if ("id" in currency && currency.id) {
    return currency.id;
  }
  return currency.ticker;
}

export const sortByMarketcap = <C extends Currency>(currencies: C[], tickers: string[]): C[] => {
  const tickerMap = lazyLoadTickerMap();
  const sortedCurrenciesMap: Map<string, C> = new Map();
  const currenciesSet = new Set(currencies.map(currency => getCurrencyId(currency)));

  tickers.forEach(ticker => {
    const currency = tickerMap.get(ticker) as C | undefined;
    if (currency) {
      const currencyId = getCurrencyId(currency);
      if (currency && currenciesSet.has(currencyId)) {
        sortedCurrenciesMap.set(currencyId, currency);
      }
    }
  });

  const remainingCurrencies = currencies.filter(
    currency => !sortedCurrenciesMap.has(getCurrencyId(currency)),
  );

  return Array.from(sortedCurrenciesMap.values()).concat(remainingCurrencies);
};

let marketcapTickersCache;
export const getMarketcapTickers: () => Promise<string[]> = makeLRUCache(() =>
  api.fetchMarketcapTickers().then(tickers => {
    marketcapTickersCache = tickers;
    return tickers;
  }),
);
// React style version of getMarketcapTickers
export const useMarketcapTickers = (): string[] | null | undefined => {
  const [tickers, setMarketcapTickers] = useState(marketcapTickersCache);
  useEffect(() => {
    let isMounted = true;

    getMarketcapTickers().then(data => {
      if (isMounted) setMarketcapTickers(data);
    });

    return () => {
      isMounted = false;
    };
  }, []);
  return tickers;
};
export const currenciesByMarketcap = <C extends Currency>(currencies: C[]): Promise<C[]> =>
  getMarketcapTickers().then(
    tickers => sortByMarketcap(currencies, tickers),
    () => currencies,
  );
// React style version of currenciesByMarketcap
export const useCurrenciesByMarketcap = <C extends Currency>(currencies: C[]): C[] => {
  const tickers = useMarketcapTickers();
  return tickers ? sortByMarketcap(currencies, tickers) : currencies;
};
