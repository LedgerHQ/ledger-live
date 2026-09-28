// Retry policy shared by the indexer reads. The Kaspa endpoint throttles bursts with HTTP 429 and,
// as observed, sends no Retry-After, so the default wait is an exponential backoff long enough to
// outlast a throttle window (1 s, 2 s, 4 s, 8 s → up to ~15 s over 5 attempts). A Retry-After, if
// the endpoint ever sends one, takes precedence (capped).
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 10_000;
const MAX_RETRY_AFTER_MS = 30_000;

/**
 * - "rate-limit": retry only HTTP 429 — safe for any read, leaves other failures to the caller.
 * - "transient": also retry 5xx and network-level errors (fetch rejects those with a TypeError).
 */
export type RetryOn = "rate-limit" | "transient";

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const backoff = (attempt: number) => Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);

/** Retry-After as a wait in ms — delta-seconds or an HTTP date; undefined if absent or unparsable. */
export function parseRetryAfter(
  value: string | null | undefined,
  now = Date.now(),
): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - now;
  if (!Number.isFinite(ms) || ms < 0) return undefined;
  return Math.min(ms, MAX_RETRY_AFTER_MS);
}

/**
 * `fetch` with retries. Returns the last response even when it is not ok, so each caller keeps
 * building its own error from `response.status`; rethrows a network error once retries are spent.
 */
export async function fetchWithRetry(
  input: string | URL,
  init?: RequestInit,
  retryOn: RetryOn = "rate-limit",
): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const lastAttempt = attempt >= MAX_ATTEMPTS;
    let response: Response;
    try {
      response = await fetch(input, init);
    } catch (error) {
      if (lastAttempt || retryOn !== "transient" || !(error instanceof TypeError)) throw error;
      await delay(backoff(attempt));
      continue;
    }

    const retriable =
      response.status === 429 || (retryOn === "transient" && response.status >= 500);
    if (response.ok || !retriable || lastAttempt) return response;

    await delay(parseRetryAfter(response.headers?.get("retry-after")) ?? backoff(attempt));
  }
}
