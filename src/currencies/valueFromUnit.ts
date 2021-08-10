import { BigNumber } from "bignumber.js";
import type { Unit } from "../types";

/**
 * convert a value in a given unit to a normalized value
 * For instance, for 1 BTC, valueFromUnit(1, btcUnit) returns 100000000
 * @memberof countervalue
 */
export const valueFromUnit = (valueInUnit: BigNumber, unit: Unit) =>
  valueInUnit.times(new BigNumber(10).pow(unit.magnitude));
