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
  const formatted = new Intl.NumberFormat(locale, {
    style: currency ? "currency" : "decimal",
    currency,
    notation: shorten ? "compact" : "standard",
    maximumFractionDigits: shorten ? 3 : 8,
  }).format(value);
  const upperTicker = ticker?.trim().toUpperCase();
  return upperTicker ? `${formatted} ${upperTicker}` : formatted;
};

export default counterValueFormatter;
