// @flow
import type { Unit } from "../../types";

/**
 * convert a value in a given unit to a normalized value
 * For instance, for 1 BTC, valueFromUnit(1, btcUnit) returns 100000000
 * @memberof helpers/countervalue
 */
export const valueFromUnit = (valueInUnit: number, unit: Unit) =>
  valueInUnit * 10 ** unit.magnitude;
