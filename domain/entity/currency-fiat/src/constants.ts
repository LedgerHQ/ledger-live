/**
 * ISO 4217 tickers of fiat currencies restricted under OFAC sanctions programs.
 * Any ticker in this set is excluded from the supported-fiats list.
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

/**
 * Ordered list of tickers used as the offline fallback when the CVS endpoint
 * is unreachable. Mirrors the default response of `/v3/supported/fiat`;
 * OFAC-restricted entries are filtered out at runtime by `buildFallbackFiats`.
 */
export const FALLBACK_FIAT_TICKERS: readonly string[] = [
  "AED",
  "AUD",
  "BHD",
  "BRL",
  "CAD",
  "CHF",
  "CLP",
  "CNY",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "HKD",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "JPY",
  "KRW",
  "MXN",
  "MYR",
  "NGN",
  "NOK",
  "NZD",
  "PHP",
  "PKR",
  "PLN",
  "RUB",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "UAH",
  "USD",
  "VND",
  "ZAR",
];
