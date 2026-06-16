/**
 * OFAC-sanctioned fiat tickers that must never be offered as countervalues,
 * regardless of what the Countervalues Service returns.
 */
export const OFAC_CURRENCIES: ReadonlySet<string> = new Set([
  "AFN",
  "BYN",
  "CUP",
  "CUC",
  "IRR",
  "IQD",
  "KPW",
  "RUB",
  "SDG",
  "SYP",
  "MMK",
]);

/** Whether a ticker is OFAC-sanctioned and must be excluded. */
export function isOfacCurrency(ticker: string): boolean {
  return OFAC_CURRENCIES.has(ticker);
}
