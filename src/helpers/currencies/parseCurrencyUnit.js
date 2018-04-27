//@flow
import type { Unit } from "../../types";

// parse a value that was formatted with formatCurrencyUnit
// NB this function parse a subset of formats because it it locale independant.
// make sure you have at least following options set on the formatter:
// - useGrouping: true
// - showCode: false
export const parseCurrencyUnit = (unit: Unit, valueString: string): number => {
  const str = valueString.replace(/,/g, ".");
  const value = parseFloat(str);
  if (isNaN(value)) return 0;
  return Math.round(value * 10 ** unit.magnitude);
};
