// Options for the shared `retry` (@ledgerhq/coin-module-framework/promises) used by every Kaspa REST
// call. The upstream provider throttles bursts with HTTP 429 (no Retry-After) and its gateway
// intermittently answers 504, so the wait doubles from 1 s: 1, 2, 4, 8 s between 5 attempts (~15 s).

/** An Error carrying the HTTP status, so a retry condition can tell failures apart. */
export const httpError = (message: string, status: number): Error & { status: number } =>
  Object.assign(new Error(message), { status });

const statusOf = (error: unknown): number | undefined =>
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  typeof error.status === "number"
    ? error.status
    : undefined;

/** HTTP 429: a throttling refusal. */
export const isRateLimited = (error: unknown): boolean => statusOf(error) === 429;

/** 429, a 5xx, or a network-level failure (fetch rejects those with a TypeError). */
export const isTransient = (error: unknown): boolean => {
  if (error instanceof TypeError) return true;
  const status = statusOf(error);
  return status === 429 || (status !== undefined && status >= 500);
};

const BACKOFF = { maxRetry: 4, interval: 1_000, intervalMultiplicator: 2 };

/** Reads have no side effect, so every transient failure is retried. */
export const READ_RETRY = { ...BACKOFF, context: "kaspa-read", retryCondition: isTransient };

/**
 * Broadcasting retries only 429, assumed to be refused before the request reaches the node. After a
 * 5xx or a network error the transaction may already have been sent, so it is left to the caller.
 */
export const BROADCAST_RETRY = {
  ...BACKOFF,
  context: "kaspa-broadcast",
  retryCondition: isRateLimited,
};
