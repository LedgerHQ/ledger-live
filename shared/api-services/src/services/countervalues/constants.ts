/**
 * RTK Query reducer path for the Countervalues Service — stable; it keys the store slice.
 *
 * `LEDGER_COUNTERVALUES_API` also backs `marketApi`, `counterValuesApi` and `ofacGeoBlockApi` in
 * live-common. When those migrate to `domain/api` they inject here rather than adding a `createApi`.
 */
export const COUNTERVALUES_REDUCER_PATH = "countervaluesApi";

/** Max retries for transient Countervalues Service request failures. */
export const MAX_RETRIES = 3;
