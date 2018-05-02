// @flow
import type { CounterValuesState, Histodays } from "./types";
import type { Currency } from "../types";
import { formatCounterValueDay } from ".";

type Pair = {
  from: Currency,
  to: Currency,
  exchange: string,
  dateFrom: Date,
  dateTo: Date,
  rate: Date => number
};

export const genDateRange = ({ dateFrom, dateTo, rate }: Pair): Histodays => {
  const histodays = {};
  for (let d = dateFrom; d < dateTo; d += 24 * 60 * 60 * 1000) {
    const day = new Date(d);
    histodays[formatCounterValueDay(day)] = rate(new Date(d));
  }
  histodays.latest = rate(new Date());
  return histodays;
};

export const genStoreState = (pairs: Pair[]): CounterValuesState => {
  const state = { rates: {} };
  for (const pair of pairs) {
    const { from, to, exchange } = pair;
    const a = (state.rates[to.ticker] = state.rates[to.ticker] || {});
    const b = (a[from.ticker] = a[from.ticker] || {});
    b[exchange] = genDateRange(pair);
  }
  return state;
};
