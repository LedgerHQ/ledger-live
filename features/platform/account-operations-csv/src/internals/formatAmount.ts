import BigNumber from "bignumber.js";
import type { Unit } from "@domain/entity-currency-unit";

/**
 * An amount in the smallest unit, as a plain decimal of `unit`: every digit kept, no grouping, the
 * trailing zeros dropped unless the unit shows all its digits.
 */
export function formatAmount(amount: BigNumber.Value, unit: Unit): string {
  const value = new BigNumber(amount)
    .shiftedBy(-unit.magnitude)
    .decimalPlaces(unit.magnitude, BigNumber.ROUND_HALF_UP);
  return unit.showAllDigits ? value.toFixed(unit.magnitude) : value.toFixed();
}
