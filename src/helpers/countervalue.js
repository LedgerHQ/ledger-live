// @flow

import type { Currency, Unit } from "../types";

/**
 * Synchronously lookup the history price of coin against a fiat.
 * the returned countervalue is expressed in satoshis per cents so it can be multiplied by the value to convert.
 */
export type GetPairHistory = (
  coinTicker: string,
  fiat: string
) => Date => ?number;

/**
 * Returns the calculated countervalue for a given amount value at a specific date (fallback to "now")
 */
export type Calc = (value: number, date?: Date) => number;

/*
*/
export type CalculateCounterValue = (cur: Currency, fiat: Unit) => Calc;

/**
 * creates a CalculateCounterValue utility with a GetPairHistory.
 * This can be plugged on a redux store.
 * NB you still have to sync prices yourself. (later we might embrace future React suspense idea in GetPairHistory)
 */
export const makeCalculateCounterValue = (
  getPairHistory: GetPairHistory
): CalculateCounterValue => (currency, fiatUnit) => {
  // FIXME we need to introduce ticker field on currency type
  const getPair = getPairHistory(currency.units[0].code, fiatUnit.code);
  return (value, date = new Date()) => {
    const countervalue = getPair(date);
    if (!countervalue) return 0;
    return Math.round(value * countervalue);
  };
};

const twoDigits = (n: number) => (n > 9 ? `${n}` : `0${n}`);
/**
 */
export const formatCounterValueDay = (d: Date) =>
  `${d.getFullYear()}-${twoDigits(d.getMonth() + 1)}-${twoDigits(d.getDate())}`;
