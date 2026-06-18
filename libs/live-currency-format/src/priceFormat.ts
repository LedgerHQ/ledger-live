import { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
  type FormatterValue,
} from "./formatCurrencyUnit";

// 2 digits when |fiat| >= 1 ("$50,000.00"), 6 otherwise ("$0.000012").
const digitsFor = (absFiat: number): number => (absFiat >= 1 ? 2 : 6);

const priceOptions = (absFiat: number, unit: Unit) => {
  const isSubUnit = absFiat > 0 && absFiat < 1;
  return {
    disableRounding: isSubUnit,
    subMagnitude: isSubUnit ? Math.max(0, digitsFor(absFiat) - unit.magnitude) : 0,
  };
};

const valueFromUnit = (valueInUnit: BigNumber, unit: Unit): BigNumber =>
  valueInUnit.times(new BigNumber(10).pow(unit.magnitude));

/** Format a fiat price expressed in the unit's smallest atom. */
export function formatPrice(
  unit: Unit,
  value: BigNumber,
  opts: { showCode?: boolean; locale?: string; discreet?: boolean; alwaysShowSign?: boolean } = {},
): string {
  const absFiat = value.abs().shiftedBy(-unit.magnitude).toNumber();
  return formatCurrencyUnit(unit, value, {
    showCode: opts.showCode ?? false,
    locale: opts.locale,
    discreet: opts.discreet,
    alwaysShowSign: opts.alwaysShowSign,
    ...priceOptions(absFiat, unit),
  });
}

/** Fragment formatter for AmountDisplay (splits integer / decimal / code parts). */
export function formatPriceFragment(
  unit: Unit,
  fiatAmount: number,
  locale: string,
): FormatterValue {
  return formatCurrencyUnitFragment(unit, valueFromUnit(new BigNumber(fiatAmount), unit), {
    locale,
    showCode: true,
    showAllDigits: true,
    useGrouping: true,
    ...priceOptions(Math.abs(fiatAmount), unit),
  });
}

/** Signed fiat variation with a `<` threshold marker for sub-resolution amounts. */
export function formatSignedFiatVariation(fiatAmount: number, unit: Unit, locale: string): string {
  const abs = Math.abs(fiatAmount);
  const opts = priceOptions(abs, unit);
  const resolution = 10 ** -(unit.magnitude + opts.subMagnitude);
  const at = (v: number): string =>
    formatCurrencyUnit(unit, valueFromUnit(new BigNumber(v), unit), {
      locale,
      showCode: true,
      showAllDigits: true,
      ...opts,
    });

  if (abs === 0) return at(0);
  const sign = fiatAmount < 0 ? "-" : "+";
  return abs < resolution ? `${sign}<${at(resolution)}` : `${sign}${at(abs)}`;
}

/** Pre-round a numeric fiat price using the shared digit rule. */
export function roundFiatPrice(price: number): number {
  return Number.parseFloat(price.toFixed(digitsFor(Math.abs(price))));
}
