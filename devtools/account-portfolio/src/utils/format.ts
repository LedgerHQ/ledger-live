/** An integer amount in an asset's smallest unit, as a decimal in its main unit. */
export function formatAmount(amount: string, decimals?: number): string {
  if (decimals === undefined || !/^-?\d+$/.test(amount)) return amount;
  const negative = amount.startsWith("-");
  const digits = amount.replace("-", "").padStart(decimals + 1, "0");
  const integer = digits.slice(0, digits.length - decimals);
  const fraction = digits.slice(digits.length - decimals).replace(/0+$/, "");
  return `${negative ? "-" : ""}${integer}${fraction ? `.${fraction}` : ""}`;
}

export function formatCurrencyValue(
  value: number | undefined,
  currency: string,
): string | undefined {
  if (value === undefined) return undefined;
  const amount = value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount} ${currency.toUpperCase()}`;
}

/** First and last characters, for hashes and ids that would not fit. */
export function shorten(value: string, edge = 6): string {
  return value.length <= edge * 2 + 1 ? value : `${value.slice(0, edge)}…${value.slice(-edge)}`;
}
