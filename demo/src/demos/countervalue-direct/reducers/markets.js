// @flow
import {
  getCryptoCurrencyById,
  getFiatCurrencyByTicker
} from "@ledgerhq/live-common/lib/currencies";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import { createSelector } from "reselect";

export type State = Array<{
  from: ?Currency,
  to: ?Currency,
  exchange: ?string
}>;

const initialState: State = [
  {
    from: getCryptoCurrencyById("bitcoin"),
    to: getFiatCurrencyByTicker("USD"),
    exchange: "KRAKEN"
  },
  {
    from: getCryptoCurrencyById("bitcoin"),
    to: getFiatCurrencyByTicker("EUR"),
    exchange: null
  },
  {
    from: getCryptoCurrencyById("ripple"),
    to: getCryptoCurrencyById("ethereum"),
    exchange: null
  },
  {
    from: getCryptoCurrencyById("litecoin"),
    to: getCryptoCurrencyById("bitcoin"),
    exchange: null
  }
];

const reducers = {
  ADD_MARKET: state => state.concat({ from: null, to: null, exchange: null }),

  SET_MARKET: (state, action) =>
    state.map((market, i) => {
      if (i !== action.index) return market;
      return { ...market, ...action.patch };
    }),

  SET_EXCHANGE_PAIRS: (state, action) =>
    state.map(market => {
      if (!market.from || !market.to) return market;
      const el = action.pairs.find(
        p => p.from === market.from && p.to === market.to
      );
      if (el) {
        return { ...market, exchange: el.exchange };
      }
      return market;
    })
};

export default (state: State = initialState, action: *) => {
  const reducer = reducers[action.type];
  return (reducer && reducer(state, action)) || state;
};

export const marketsSelector = (state: *): State => state.markets;

export const pairsSelector = createSelector(marketsSelector, (state: State) => {
  const array = [];
  for (const { from, to, exchange } of state) {
    if (from && to) {
      array.push({ from, to, exchange });
    }
  }
  return array;
});
