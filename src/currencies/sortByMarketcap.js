// @flow
import type { Currency } from "../types";

export const sortByMarketcap = <C: Currency>(
  currencies: C[],
  tickers: string[]
): C[] => {
  const list = currencies.slice(0);
  const prependList = [];
  tickers.forEach(ticker => {
    const item = list.find(c => !c.disableCountervalue && c.ticker === ticker);
    if (item) {
      list.splice(list.indexOf(item), 1);
      prependList.push(item);
    }
  });
  return prependList.concat(list);
};
