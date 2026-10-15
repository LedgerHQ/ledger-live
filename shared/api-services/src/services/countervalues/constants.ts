/**
 * RTK Query reducer path for the Countervalues Service — stable; it keys the store slice.
 *
 * `LEDGER_COUNTERVALUES_API` also backs `marketApi` in live-common. When that migrates to
 * `domain/api` it injects here rather than adding a `createApi`, as
 * `@domain/api-market-countervalues` and `@domain/api-ofac` do.
 */
export const COUNTERVALUES_REDUCER_PATH = "countervaluesApi";

/** Max retries for transient Countervalues Service request failures. */
export const MAX_RETRIES = 3;
