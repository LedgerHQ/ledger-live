import { getEnv } from "@ledgerhq/live-env";
import { REQUEST_TIMEOUT_MS } from "./graphql/constants";

export type Inputs = Parameters<typeof fetch>;

/** Linear backoff between retries — staggers load on a flaky upstream without delaying abort. */
const RETRY_BACKOFF_BASE_MS = 200;
const RETRY_BUDGET_DEFAULT = 3;

export function inferNetworkFromUrl(url: string): string {
  if (url.includes("testnet")) return "testnet";
  if (url.includes("devnet")) return "devnet";
  if (url.includes("127.0.0.1") || url.includes("localhost")) return "localnet";
  return "mainnet";
}

/**
 * Retry-aware fetch shared by both the JSON-RPC and GraphQL transports.
 * Each attempt races a per-attempt timeout against any caller-supplied `signal`
 * via `AbortSignal.any` — whichever fires first wins.
 * Recursion passes `options` (not `opts`) so each retry gets a fresh abort controller.
 * Caller-signal aborts propagate immediately; only timeout / transport errors retry.
 */
export const fetcher = (
  url: Inputs[0],
  options: Inputs[1],
  retry = RETRY_BUDGET_DEFAULT,
): Promise<Response> => {
  const version = getEnv("LEDGER_CLIENT_VERSION") || "";
  const isCI = version.includes("ll-ci") || version === "";
  // Bind to a local so the header path runs even when caller passes no `options`.
  const baseOptions: RequestInit = options ?? {};
  baseOptions.headers = {
    ...baseOptions.headers,
    "X-Ledger-Client-Version": isCI ? "lld/2.124.0-dev" : version, // for integration cli tests
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const signal = baseOptions.signal
    ? AbortSignal.any([controller.signal, baseOptions.signal])
    : controller.signal;
  const opts: RequestInit = { ...baseOptions, signal };
  const finalize = (p: Promise<Response>): Promise<Response> =>
    p.finally(() => clearTimeout(timer));

  if (retry === 1) return finalize(fetch(url, opts));

  return finalize(
    fetch(url, opts).catch(async err => {
      // Caller-signal abort must terminate immediately; retrying after teardown
      // re-issues GraphQL traffic the wallet has already unsubscribed from.
      if (baseOptions.signal?.aborted) throw err;
      // Linear backoff before the next attempt — `attempt` grows from 1 upward.
      const attempt = RETRY_BUDGET_DEFAULT - retry + 1;
      await new Promise(resolve => setTimeout(resolve, RETRY_BACKOFF_BASE_MS * attempt));
      return fetcher(url, options, retry - 1);
    }),
  );
};
