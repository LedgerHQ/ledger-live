import numeral from "numeral";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "./formatCurrencyUnit";
import type { Unit } from "@ledgerhq/types-cryptoassets";

/**
 * This will format in a very concise way a valid, typically to be used on axis.
 * For instance 15k 20k ,...
 */
export function formatShort(unit: Unit, value: BigNumber): string {
  const { magnitude } = unit;
  const floatValue = value.div(new BigNumber(10).pow(magnitude));

  if (floatValue.isZero()) {
    return "0";
  }

  if (new BigNumber(-1).isLessThan(floatValue) && floatValue.isLessThan(1)) {
    // numeral have issues with low values, fallback on formatCurrencyUnit
    return formatCurrencyUnit(unit, value);
  }

  return numeral(floatValue.toNumber()).format("0[.]0a");
}
