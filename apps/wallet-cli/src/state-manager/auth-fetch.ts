import axios from "axios";
import makeFetchCookie from "fetch-cookie";
import type { FetchFn } from "@ledgerhq/auth";

// A stalled token fetch must fail fast, so the shared base query can still send the quote.
const AUTH_REQUEST_TIMEOUT_MS = 10_000;
let authRequestTimeoutMs = AUTH_REQUEST_TIMEOUT_MS;
// Deadline of the current token fetch, shared by the Keycloak and LKRP calls.
let authDeadline: AbortSignal | undefined;

/** @internal Test seam — shortens the auth timeout; `null` restores it. */
export function _setTestAuthRequestTimeoutMs(ms: number | null): void {
  authRequestTimeoutMs = ms ?? AUTH_REQUEST_TIMEOUT_MS;
}

// LKRP sends its OIDC calls through live-network's axios, which only times out GETs.
axios.interceptors.request.use(config => {
  if (config.url?.includes("/openid/v1/")) config.signal ??= authDeadline;
  return config;
});

/**
 * Fetch for the Keycloak calls of one CLI run. Keycloak keeps its auth session in a cookie across
 * the challenge redirect, which Bun's fetch does not persist. `globalThis.fetch` is resolved per
 * call so a fetch patched after startup (test interceptors) is still used.
 */
export function createAuthFetch(): FetchFn {
  const cookieFetch = makeFetchCookie((input: RequestInfo | URL, init?: RequestInit) =>
    globalThis.fetch(input, init),
  );
  authDeadline = undefined;
  // Every token fetch starts with this challenge request, so its deadline also bounds the redirect
  // hops and the LKRP calls after it.
  return (input, init) => {
    authDeadline = AbortSignal.timeout(authRequestTimeoutMs);
    return cookieFetch(input, { ...init, signal: authDeadline });
  };
}
