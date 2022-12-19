import type { Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
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
  const value = new BigNumber(str);
  if (value.isNaN()) return new BigNumber(0);
  return value.times(new BigNumber(10).pow(unit.magnitude)).integerValue();
};
