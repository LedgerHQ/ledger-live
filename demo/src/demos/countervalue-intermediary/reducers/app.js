// @flow
import {
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
  listCryptoCurrencies
} from "@ledgerhq/live-common/lib/currencies";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import { createSelector } from "reselect";

export type State = {
  countervalueCurrency: Currency,
  countervalueExchange: ?string,
  intermediaryCurrency: Currency,
  rows: Array<{
    currency: ?Currency,
    exchange: ?string,
    value: number
  }>
};

const pick = array => array[Math.floor(Math.random() * array.length)];

const initialState: State = {
  countervalueCurrency: getFiatCurrencyByTicker("USD"),
  countervalueExchange: "Kraken",
  intermediaryCurrency: getCryptoCurrencyById("bitcoin"),
  rows: [
    {
      currency: getCryptoCurrencyById("bitcoin"),
      exchange: null,
      value: 0.5
    },
    {
      currency: getCryptoCurrencyById("litecoin"),
      exchange: "BINANCE",
      value: 2
    },
    {
      currency: getCryptoCurrencyById("ethereum"),
      exchange: "BINANCE",
      value: 1
    },
    {
      currency: getCryptoCurrencyById("zencash"),
      exchange: "BINANCE",
      value: 10
    }
  ]
};

const reducers: { [_: string]: (State, *) => State } = {
  SET_COUNTERVALUE_CURRENCY: (state, { currency }) => ({
    ...state,
    countervalueCurrency: currency
  }),

  SET_COUNTERVALUE_EXCHANGE: (state, { exchange }) => ({
    ...state,
    countervalueExchange: exchange
  }),

  ADD_ROW: state => ({
    ...state,
    rows: state.rows.concat({
      currency: pick(listCryptoCurrencies()),
      exchange: null,
      value: 1
    })
  }),

  SET_ROW: (state, action) => ({
    ...state,
    rows: state.rows.map((row, i) => {
      if (i !== action.index) return row;
      return { ...row, ...action.patch };
    })
  }),

  SET_EXCHANGE_PAIRS: (state, action) => {
    state = { ...state };

    // re-set the countervalueExchange if it is in the pairs
    const globalPair = action.pairs.find(
      p =>
        p.from.ticker === state.intermediaryCurrency.ticker &&
        p.to.ticker === state.countervalueCurrency.ticker
    );
    if (globalPair) {
      state.countervalueExchange = globalPair.exchange;
    }

    // For all row, also synchronize with potential updates
    state.rows = state.rows.map(row => {
      if (!row.currency) return row;
      const el = action.pairs.find(
        p =>
          row.currency &&
          p.from.ticker === row.currency.ticker &&
          p.to.ticker === state.intermediaryCurrency.ticker
      );
      if (el) {
        return { ...row, exchange: el.exchange };
      }
      return row;
    });

    return state;
  }
};

export default (state: State = initialState, action: *) => {
  const reducer = reducers[action.type];
  return (reducer && reducer(state, action)) || state;
};

export const appSelector = (state: *): State => state.app;

export const pairsSelector = createSelector(appSelector, (state: State) => {
  const array = [];
  const {
    countervalueCurrency,
    countervalueExchange,
    intermediaryCurrency,
    rows
  } = state;
  array.push({
    from: intermediaryCurrency,
    to: countervalueCurrency,
    exchange: countervalueExchange
  });
  for (const { currency, exchange } of rows) {
    if (currency && currency.ticker !== intermediaryCurrency.ticker) {
      array.push({ from: currency, to: intermediaryCurrency, exchange });
    }
  }
  return array;
});
