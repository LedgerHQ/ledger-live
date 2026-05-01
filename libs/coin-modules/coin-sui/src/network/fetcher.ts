import { getEnv } from "@ledgerhq/live-env";
import { REQUEST_TIMEOUT_MS } from "./graphql/constants";

type GenericInput<T> = T extends (...args: infer K) => unknown ? K : never;
export type Inputs = GenericInput<typeof fetch>;

/** URL → Sui network identifier (mainnet/testnet/devnet/localnet). */
export function inferNetworkFromUrl(url: string): string {
  if (url.includes("testnet")) return "testnet";
  if (url.includes("devnet")) return "devnet";
  if (url.includes("127.0.0.1") || url.includes("localhost")) return "localnet";
  return "mainnet";
}

/**
 * Retry-aware fetch shared by both the JSON-RPC and GraphQL transports.
 * Per-attempt deadline (REQUEST_TIMEOUT_MS) is the only cancellation
 * path wired today — no Sui caller threads `signal` through yet, so
 * `options?.signal` is dead until one does. Recursion passes `options`
 * (not `opts`) so each retry gets a fresh controller; reusing `opts`
 * would race a stale/aborted signal.
 */
export const fetcher = (url: Inputs[0], options: Inputs[1], retry = 3): Promise<Response> => {
  const version = getEnv("LEDGER_CLIENT_VERSION") || "";
  const isCI = version.includes("ll-ci") || version === "";
  if (options) {
    options.headers = {
      ...options.headers,
      "X-Ledger-Client-Version": isCI ? "lld/2.124.0-dev" : version, // for integration cli tests
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const opts: RequestInit = {
    ...(options ?? {}),
    signal: options?.signal ?? controller.signal,
  };
  const finalize = (p: Promise<Response>): Promise<Response> =>
    p.finally(() => clearTimeout(timer));

  if (retry === 1) return finalize(fetch(url, opts));

  return finalize(fetch(url, opts).catch(() => fetcher(url, options, retry - 1)));
};
