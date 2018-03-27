/**
 * @module helpers/countervalue
 * @flow
 */

import type { GetPairHistory, CalculateCounterValue } from "../types";

/**
 * creates a CalculateCounterValue utility with a GetPairHistory.
 * This can be plugged on a redux store.
 * NB you still have to sync prices yourself. (later we might embrace future React suspense idea in GetPairHistory)
 * @memberof helpers/countervalue
 */
export const makeCalculateCounterValue = (
  getPairHistory: GetPairHistory
): CalculateCounterValue => (currency, fiatUnit) => {
  // FIXME we need to introduce ticker field on currency type
  const getPair = getPairHistory(currency.units[0].code, fiatUnit.code);
  return (value, date) => {
    // we try to pick at the date, otherwise we fallback on the "latest" countervalue
    const rate = getPair(date) || getPair();
    if (!rate) return 0;
    return Math.round(value * rate);
  };
};

/**
 * creates the inverse version of makeCalculateCounterValue.
 * this allows to goes from a countervalue to the currency value.
 * @memberof helpers/countervalue
 */
export const makeInverseCalculateCounterValue = (
  getPairHistory: GetPairHistory
): CalculateCounterValue => (currency, fiatUnit) => {
  // FIXME we need to introduce ticker field on currency type
  const getPair = getPairHistory(currency.units[0].code, fiatUnit.code);
  return (countervalue, date) => {
    // we try to pick at the date, otherwise we fallback on the "latest" countervalue
    const rate = getPair(date) || getPair();
    if (!rate) return 0;
    return Math.round(countervalue / rate);
  };
};

const twoDigits = (n: number) => (n > 9 ? `${n}` : `0${n}`);

/**
 * efficient implementation of YYYY-MM-DD formatter
 * @memberof helpers/countervalue
 */
export const formatCounterValueDay = (d: Date) =>
  `${d.getFullYear()}-${twoDigits(d.getMonth() + 1)}-${twoDigits(d.getDate())}`;
