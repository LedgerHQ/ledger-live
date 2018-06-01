//@flow
import type { Unit } from "../../types";
import numeral from "numeral";
import { formatCurrencyUnit } from "./formatCurrencyUnit";

/**
 * This will format in a very concise way a valid, typically to be used on axis.
 * For instance 15k 20k ,...
 */
export function formatShort(unit: Unit, value: number): string {
  const { magnitude } = unit;
  const floatValue = value / 10 ** magnitude;
  if (floatValue === 0) {
    return "0";
  }
  if (-1 < floatValue && floatValue < 1) {
    // numeral have issues with low values, fallback on formatCurrencyUnit
    return formatCurrencyUnit(unit, value);
  }
  return numeral(floatValue).format("0[.]0a");
}
