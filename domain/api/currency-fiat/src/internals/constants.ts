// Package-private: nothing under `internals/` is re-exported from the public barrel (`../index.ts`).

/** RTK Query cache tags exposed by the fiat currency api. */
export const FIAT_TAGS = ["SupportedFiats"] as const;

/** RTK Query reducer path for the fiat currency API — stable; it keys the store slice. */
export const CURRENCY_FIAT_REDUCER_PATH = "currencyFiatApi";

/** Max retries for transient Countervalues Service request failures. */
export const MAX_RETRIES = 3;

/**
 * OFAC-sanctioned fiat tickers, filtered out of the supported list regardless of what the
 * Countervalues Service returns.
 *
 * Duplicated here on purpose: the domain package must not depend on `@ledgerhq/live-common`.
 * A single source of truth can be revisited once the legacy `support.ts` is retired.
 */
export const OFAC_FIAT_TICKERS: ReadonlySet<string> = new Set([
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
