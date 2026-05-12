import { getEnv } from "@ledgerhq/live-env";
import type { SuiClientTypes } from "@mysten/sui/client";

const RETRY_BACKOFF_BASE_MS = 200;
const RETRY_LIMIT = 3;
/** Per-attempt deadline. 30 s × 3 retries ≈ 90 s worst case for the ~50 KB system-state payload. */
const REQUEST_TIMEOUT_MS = 30_000;

export function inferNetworkFromUrl(url: string): SuiClientTypes.Network {
  if (url.includes("testnet")) return "testnet";
  if (url.includes("devnet")) return "devnet";
  if (url.includes("127.0.0.1") || url.includes("localhost")) return "localnet";
  return "mainnet";
}

/**
 * Retry-aware fetch shared by JSON-RPC and GraphQL transports. Each attempt
 * gets its own AbortController as a per-request timeout safety net so a stuck
 * request can't hang forever; the timer is cleared per-attempt so timers don't
 * pile up across retries.
 */
export const fetcher: typeof fetch = (url, options) => fetchWithRetry(url, options, RETRY_LIMIT);

const fetchWithRetry = (
  url: RequestInfo | URL,
  options: RequestInit | undefined,
  retry: number,
): Promise<Response> => {
  const version = getEnv("LEDGER_CLIENT_VERSION") || "";
  const isCI = version.includes("ll-ci") || version === "";
  const headers = {
    ...options?.headers,
    "X-Ledger-Client-Version": isCI ? "lld/2.124.0-dev" : version, // for integration cli tests
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const opts: RequestInit = { ...options, headers, signal: controller.signal };

  const attempt = fetch(url, opts).finally(() => clearTimeout(timer));

  if (retry === 1) return attempt;

  return attempt.catch(async () => {
    const attemptNum = RETRY_LIMIT - retry + 1;
    await new Promise(resolve => setTimeout(resolve, RETRY_BACKOFF_BASE_MS * attemptNum));
    return fetchWithRetry(url, options, retry - 1);
  });
};
