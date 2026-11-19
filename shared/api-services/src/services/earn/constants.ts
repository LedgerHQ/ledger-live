/** RTK Query reducer path for the Earn backend: stable, it keys the store slice. */
export const EARN_REDUCER_PATH = "earnApi";

/** Max retries for transient Earn request failures. */
export const MAX_RETRIES = 2;

/** Time after which an Earn request attempt is aborted, when the request sets no `timeoutMs`. */
export const EARN_REQUEST_TIMEOUT_MS = 10_000;
