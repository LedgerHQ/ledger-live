/**
 * RTK Query reducer path for the Countervalues Service — stable; it keys the store slice.
 *
 * The `@domain/api-*` packages inject their endpoints here rather than adding a `createApi`, as
 * `@domain/api-market-countervalues`, `@domain/api-market-currency` and `@domain/api-ofac` do.
 */
export const COUNTERVALUES_REDUCER_PATH = "countervaluesApi";

/** Max retries for transient Countervalues Service request failures. */
export const MAX_RETRIES = 3;
