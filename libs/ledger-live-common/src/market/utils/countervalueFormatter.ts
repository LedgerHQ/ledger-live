export const counterValueFormatter = ({
  currency,
  value,
  shorten,
  locale,
}: {
  currency?: string;
  value: number;
  shorten?: boolean;
  locale: string;
}): string => {
  if (!value) {
    return "-";
  }

  return new Intl.NumberFormat(locale, {
    style: currency ? "currency" : "decimal",
    currency,
    notation: shorten ? "compact" : "standard",
    maximumFractionDigits: shorten ? 3 : 8,
  }).format(value);
};

export default counterValueFormatter;
