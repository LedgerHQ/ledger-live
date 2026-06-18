import { findFiatCurrencyByTicker } from "@ledgerhq/cryptoassets";

export const counterValueFormatter = ({
  currency,
  value,
  shorten,
  locale,
  ticker,
}: {
  currency?: string;
  value?: number;
  shorten?: boolean;
  locale: string;
  ticker?: string;
}): string => {
  if (!value) {
    return "-";
  }
  const fiat = currency ? findFiatCurrencyByTicker(currency.toUpperCase()) : undefined;
  const baseOptions: Intl.NumberFormatOptions = {
    notation: shorten ? "compact" : "standard",
    maximumFractionDigits: shorten ? 3 : 8,
  };
  let formatted: string;
  if (fiat) {
    // Resolve the sign from the Ledger fiat definition (unit.code) so Market matches the price
    // and balances (e.g. "$", "CA$", "AU$", "₿") instead of Intl's locale-dependent narrow symbol.
    const unit = fiat.units[0];
    // Pin minimumFractionDigits to the fiat's magnitude (e.g. 2 for USD, 3 for BHD, 0 for JPY) so
    // decimal style keeps the trailing zeros that "currency" style used to add (2500.5 -> "2,500.50").
    const number = new Intl.NumberFormat(locale, {
      ...baseOptions,
      style: "decimal",
      minimumFractionDigits: unit.magnitude,
    }).format(value);
    formatted = unit.prefixCode ? `${unit.code}${number}` : `${number} ${unit.code}`;
  } else {
    formatted = new Intl.NumberFormat(locale, {
      ...baseOptions,
      style: currency ? "currency" : "decimal",
      currency,
    }).format(value);
  }
  const upperTicker = ticker?.trim().toUpperCase();
  return upperTicker ? `${formatted} ${upperTicker}` : formatted;
};

export default counterValueFormatter;
