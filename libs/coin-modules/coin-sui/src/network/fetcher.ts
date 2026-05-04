import { getEnv } from "@ledgerhq/live-env";
import type { SuiClientTypes } from "@mysten/sui/client";
import { REQUEST_TIMEOUT_MS } from "./graphql/constants";

const RETRY_BACKOFF_BASE_MS = 200;
const RETRY_LIMIT = 3;

export function inferNetworkFromUrl(url: string): SuiClientTypes.Network {
  if (url.includes("testnet")) return "testnet";
  if (url.includes("devnet")) return "devnet";
  if (url.includes("127.0.0.1") || url.includes("localhost")) return "localnet";
  return "mainnet";
}

/**
 * Retry-aware fetch shared by JSON-RPC and GraphQL transports. Per-attempt timeout races caller `signal`
 * via `AbortSignal.any`; recursion passes `options` so each retry gets a fresh abort controller.
 * Caller-signal aborts skip remaining retries;
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
  const signal = options?.signal
    ? AbortSignal.any([controller.signal, options.signal])
    : controller.signal;
  const opts: RequestInit = { ...options, headers, signal };
  const finalize = (p: Promise<Response>): Promise<Response> =>
    p.finally(() => clearTimeout(timer));

  if (retry === 1) return finalize(fetch(url, opts));

  return finalize(
    fetch(url, opts).catch(async err => {
      if (options?.signal?.aborted) throw err;
      const attempt = RETRY_LIMIT - retry + 1;
      await new Promise(resolve => setTimeout(resolve, RETRY_BACKOFF_BASE_MS * attempt));
      return fetchWithRetry(url, options, retry - 1);
    }),
  );
};
