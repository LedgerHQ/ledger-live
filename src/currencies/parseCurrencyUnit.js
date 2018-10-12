//@flow
import { BigNumber } from "bignumber.js";
import type { Unit } from "../types";

// parse a value that was formatted with formatCurrencyUnit
// NB this function parse a subset of formats because it it locale independant.
// make sure you have at least following options set on the formatter:
// - useGrouping: true
// - showCode: false
export const parseCurrencyUnit = (
  unit: Unit,
  valueString: string
): BigNumber => {
  const str = valueString.replace(/,/g, ".");
  const value = BigNumber(str);
  if (value.isNaN()) return BigNumber(0);
  return value.times(BigNumber(10).pow(unit.magnitude)).integerValue();
};
