import { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
  type formatCurrencyUnitOptions,
  type FormatterValue,
} from "@ledgerhq/live-common/currencies/index";

// Total fractional digits allowed when rendering a sub-base-unit fiat price.
// Enough to surface micro-cap prices like $0.00000591 without truncation.
// `subMagnitude` is derived so that `magnitude + subMagnitude` never exceeds
// this cap, regardless of the unit's magnitude.
const SUB_BASE_UNIT_MAX_FRACTION_DIGITS = 8;

type FiatPriceRoundingOptions = Required<
  Pick<formatCurrencyUnitOptions, "subMagnitude" | "disableRounding">
>;

/**
 * Pick `subMagnitude` / `disableRounding` so a fiat price held in its smallest
 * unit (cents for USD, etc.) keeps its significant digits even when below 1
 * base unit. Values >= 1 base unit fall back to the formatter's standard
 * dynamic rounding.
 */
export const getFiatPriceFormatOptions = (
  unit: Unit,
  valueInSmallestUnit: BigNumber,
): FiatPriceRoundingOptions => {
  const isSubBaseUnit = valueInSmallestUnit.abs().lt(new BigNumber(10).pow(unit.magnitude));
  if (!isSubBaseUnit) return { subMagnitude: 0, disableRounding: false };
  const subMagnitude = Math.max(0, SUB_BASE_UNIT_MAX_FRACTION_DIGITS - unit.magnitude);
  return { subMagnitude, disableRounding: true };
};

/**
 * Convert a fiat price expressed as a float (e.g. `0.00000591` USD) to its
 * smallest-unit BigNumber expected by `formatCurrencyUnit` /
 * `formatCurrencyUnitFragment`.
 */
export const fiatFloatToSmallestUnit = (unit: Unit, floatPrice: BigNumber.Value): BigNumber =>
  new BigNumber(floatPrice).times(new BigNumber(10).pow(unit.magnitude));

type FormatFiatPriceOptions = Omit<formatCurrencyUnitOptions, "subMagnitude" | "disableRounding">;

/**
 * Format a fiat price (in smallest unit) as a string with sub-unit precision
 * applied automatically for micro-cap values.
 */
export const formatFiatPrice = (
  unit: Unit,
  valueInSmallestUnit: BigNumber,
  options: FormatFiatPriceOptions = {},
): string =>
  formatCurrencyUnit(unit, valueInSmallestUnit, {
    ...options,
    ...getFiatPriceFormatOptions(unit, valueInSmallestUnit),
  });

/**
 * Fragment variant of {@link formatFiatPrice} for consumers that render
 * fiat prices through `AmountDisplay` / other split-render components.
 */
export const formatFiatPriceFragment = (
  unit: Unit,
  valueInSmallestUnit: BigNumber,
  options: FormatFiatPriceOptions = {},
): FormatterValue =>
  formatCurrencyUnitFragment(unit, valueInSmallestUnit, {
    ...options,
    ...getFiatPriceFormatOptions(unit, valueInSmallestUnit),
  });
