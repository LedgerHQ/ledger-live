//@flow
import type { Unit } from "../../types";
import numeral from "numeral";

/**
 * This will format in a very concise way a valid, typically to be used on axis.
 * For instance 15k 20k ,...
 */
export function formatShort(unit: Unit, value: number): string {
  const { magnitude } = unit;
  const floatValue = value / 10 ** magnitude;
  return numeral(floatValue).format("0[.]0a");
}
