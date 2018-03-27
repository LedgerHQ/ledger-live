/**
 * @module helpers/countervalue
 * @flow
 */

import type {
  GetPairHistory,
  GetCounterValue,
  CalculateCounterValue
} from "../types";

/**
 * get the countervalue rate with a GetPairHistory.
 * @memberof helpers/countervalue
 */
export const makeGetCounterValue = (
  getPairHistory: GetPairHistory
): GetCounterValue => (currency, fiatUnit) => {
  // FIXME we need to introduce ticker field on currency type
  const getPair = getPairHistory(currency.units[0].code, fiatUnit.code);
  // we try to pick at the date, otherwise we fallback on the "latest" countervalue
  return date => getPair(date) || getPair() || 0;
};

/**
 * creates a CalculateCounterValue utility with a GetPairHistory.
 * This can be plugged on a redux store.
 * NB you still have to sync prices yourself. (later we might embrace future React suspense idea in GetPairHistory)
 * @memberof helpers/countervalue
 */
export const makeCalculateCounterValue = (
  getPairHistory: GetPairHistory
): CalculateCounterValue => {
  const getCounterValue = makeGetCounterValue(getPairHistory);
  return (currency, fiatUnit) => {
    const getRate = getCounterValue(currency, fiatUnit);
    return (value, date) => Math.round(value * getRate(date));
  };
};

/**
 * creates the inverse version of makeCalculateCounterValue.
 * this allows to goes from a countervalue to the currency value.
 * @memberof helpers/countervalue
 */
export const makeReverseCounterValue = (
  getPairHistory: GetPairHistory
): CalculateCounterValue => {
  const getCounterValue = makeGetCounterValue(getPairHistory);
  return (currency, fiatUnit) => {
    const getRate = getCounterValue(currency, fiatUnit);
    return (value, date) => {
      const rate = getRate(date);
      if (!rate) return 0;
      return Math.round(value / rate);
    };
  };
};

const twoDigits = (n: number) => (n > 9 ? `${n}` : `0${n}`);

/**
 * efficient implementation of YYYY-MM-DD formatter
 * @memberof helpers/countervalue
 */
export const formatCounterValueDay = (d: Date) =>
  `${d.getFullYear()}-${twoDigits(d.getMonth() + 1)}-${twoDigits(d.getDate())}`;
