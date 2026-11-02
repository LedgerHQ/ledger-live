/**
 * ISO 4217 tickers of fiat currencies restricted under OFAC sanctions programs.
 * Private: consumers go through `isSanctionedFiatTicker`.
 */
export const OFAC_FIAT_TICKERS: ReadonlySet<string> = new Set([
  "AFN",
  "BYN",
  "CUC",
  "CUP",
  "IRR",
  "IQD",
  "KPW",
  "RUB",
  "SDG",
  "SYP",
  "MMK",
]);
