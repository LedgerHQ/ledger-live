/** RTK Query reducer path for the CAL service — stable; it keys the store slice. */
export const CAL_REDUCER_PATH = "calApi";

/** Max retries for transient CAL request failures. */
export const MAX_RETRIES = 3;

/** Max duration of one CAL request attempt. Without it a hung request never settles. */
export const CAL_REQUEST_TIMEOUT_MS = 10_000;

/** Request header carrying the Ledger client version on every CAL request. */
export const HEADER_X_LEDGER_CLIENT_VERSION = "X-Ledger-Client-Version";
