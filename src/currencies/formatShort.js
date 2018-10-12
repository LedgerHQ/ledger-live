//@flow
import { BigNumber } from "bignumber.js";
import type { Unit } from "../types";
import numeral from "numeral";
import { formatCurrencyUnit } from "./formatCurrencyUnit";

/**
 * This will format in a very concise way a valid, typically to be used on axis.
 * For instance 15k 20k ,...
 */
export function formatShort(unit: Unit, value: BigNumber): string {
  const { magnitude } = unit;
  const floatValue = value.div(BigNumber(10).pow(magnitude));
  if (floatValue.isZero()) {
    return "0";
  }
  if (BigNumber(-1).isLessThan(floatValue) && floatValue.isLessThan(1)) {
    // numeral have issues with low values, fallback on formatCurrencyUnit
    return formatCurrencyUnit(unit, value);
  }
  return numeral(floatValue.toNumber()).format("0[.]0a");
}
