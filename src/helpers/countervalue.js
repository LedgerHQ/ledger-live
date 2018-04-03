/**
 * @module helpers/countervalue
 * @flow
 */

import { deprecateFunction } from "../internal";
import type {
  GetPairRate,
  GetCounterValueRate,
  CalculateCounterValue,
  Unit
} from "../types";

/**
 * get the countervalue rate with a GetPairRate.
 * @return a normalized cent per satoshis rate
 * @memberof helpers/countervalue
 */
const makeGetCounterValueRate = (
  getPairHistory: GetPairRate
): GetCounterValueRate => (currency, fiatUnit) => {
  // FIXME we need to introduce ticker field on currency type
  const getPair = getPairHistory(currency.units[0].code, fiatUnit.code);
  // we try to pick at the date, otherwise we fallback on the "latest" countervalue
  return date => getPair(date) || getPair() || 0;
};

/**
 * creates a CalculateCounterValue utility with a GetPairRate.
 * This can be plugged on a redux store.
 * NB you still have to sync prices yourself. (later we might embrace future React suspense idea in GetPairRate)
 * @memberof helpers/countervalue
 */
export const makeCalculateCounterValue = (
  getPairHistory: GetPairRate
): CalculateCounterValue => {
  const getCounterValueRate = makeGetCounterValueRate(getPairHistory);
  return (currency, fiatUnit) => {
    const getRate = getCounterValueRate(currency, fiatUnit);
    return (value, date, disableRounding) =>
      disableRounding
        ? value * getRate(date)
        : Math.round(value * getRate(date));
  };
};

/**
 * creates the inverse version of makeCalculateCounterValue.
 * this allows to goes from a countervalue to the currency value.
 * @memberof helpers/countervalue
 */
export const makeReverseCounterValue = (
  getPairHistory: GetPairRate
): CalculateCounterValue => {
  const getCounterValueRate = makeGetCounterValueRate(getPairHistory);
  return (currency, fiatUnit) => {
    const getRate = getCounterValueRate(currency, fiatUnit);
    return (value, date, disableRounding) => {
      const rate = getRate(date);
      if (!rate) return 0;
      return disableRounding ? value / rate : Math.round(value / rate);
    };
  };
};

const twoDigits = (n: number) => (n > 9 ? `${n}` : `0${n}`);

/**
 * convert a value in a given unit to a normalized value
 * For instance, for 1 BTC, valueFromUnit(1, btcUnit) returns 100000000
 * @memberof helpers/countervalue
 */
export const valueFromUnit = (valueInUnit: number, unit: Unit) =>
  valueInUnit * 10 ** unit.magnitude;

/**
 * efficient implementation of YYYY-MM-DD formatter
 * @memberof helpers/countervalue
 */
export const formatCounterValueDay = (d: Date) =>
  `${d.getFullYear()}-${twoDigits(d.getMonth() + 1)}-${twoDigits(d.getDate())}`;

/**
 * UTC version of formatCounterValueDay
 * @memberof helpers/countervalue
 */
export const formatCounterValueDayUTC = (d: Date) =>
  `${d.getUTCFullYear()}-${twoDigits(d.getUTCMonth() + 1)}-${twoDigits(
    d.getUTCDate()
  )}`;

export const makeGetCounterValue = deprecateFunction(
  makeGetCounterValueRate,
  "makeGetCounterValue is deprecated. " +
    "countervalue rate is not meant to be directly used from userland. " +
    "If a feature is missing we add it on the wallet-common side. " +
    "This allow us to change the rate unit in the future if needed."
);
