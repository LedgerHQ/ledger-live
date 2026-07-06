// Package-private: nothing under `internals/` is re-exported from the public barrel (`../index.ts`).

/** RTK Query cache tags exposed by the fiat currency api. */
export const FIAT_TAGS = ["SupportedFiats"] as const;

/** RTK Query reducer path for the fiat currency API — stable; it keys the store slice. */
export const CURRENCY_FIAT_REDUCER_PATH = "currencyFiatApi";

/** Max retries for transient Countervalues Service request failures. */
export const MAX_RETRIES = 3;
