import type { Unit } from "@ledgerhq/types-cryptoassets";

const MAXIMUM_FRACTION_DIGITS = 8;

const getFractionDigitOptions = (
  unit: Unit | undefined,
  shorten: boolean | undefined,
): Pick<Intl.NumberFormatOptions, "maximumFractionDigits" | "minimumFractionDigits"> => {
  const maximumFractionDigits = shorten ? 3 : MAXIMUM_FRACTION_DIGITS;

  if (!unit) return { maximumFractionDigits };

  return {
    maximumFractionDigits,
    minimumFractionDigits: shorten ? 0 : Math.min(unit.magnitude, maximumFractionDigits),
  };
};

export const counterValueFormatter = ({
  unit,
  value,
  shorten,
  locale,
  ticker,
}: {
  unit?: Unit;
  value?: number;
  shorten?: boolean;
  locale: string;
  ticker?: string;
}): string => {
  if (!value) {
    return "-";
  }
  const baseOptions: Intl.NumberFormatOptions = {
    notation: shorten ? "compact" : "standard",
    ...getFractionDigitOptions(unit, shorten),
  };
  let formatted: string;
  if (unit) {
    // Resolve the sign from the Ledger unit so Market matches price and balances
    // (e.g. "$", "CA$", "AU$", "₿") instead of Intl's locale-dependent narrow symbol.
    const number = new Intl.NumberFormat(locale, {
      ...baseOptions,
      style: "decimal",
    }).format(value);
    formatted = unit.prefixCode
      ? number.startsWith("-")
        ? `-${unit.code}${number.slice(1)}`
        : `${unit.code}${number}`
      : `${number} ${unit.code}`;
  } else {
    formatted = new Intl.NumberFormat(locale, {
      ...baseOptions,
      style: "decimal",
    }).format(value);
  }
  const upperTicker = ticker?.trim().toUpperCase();
  return upperTicker ? `${formatted} ${upperTicker}` : formatted;
};

export default counterValueFormatter;
