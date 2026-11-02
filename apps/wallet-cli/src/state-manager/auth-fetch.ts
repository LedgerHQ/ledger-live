import axios from "axios";
import makeFetchCookie from "fetch-cookie";
import type { FetchFn } from "@ledgerhq/auth";
import { createTestSeam } from "../shared/test-seam";

// A stalled token fetch must fail fast, so the shared base query can still send the quote.
const AUTH_REQUEST_TIMEOUT_MS = 10_000;
const authRequestTimeoutMs = createTestSeam<number>(AUTH_REQUEST_TIMEOUT_MS);
// Deadline of the current token fetch on the `performance.now()` clock, which system clock changes do
// not move. Shared by the Keycloak and LKRP calls.
let authDeadlineAt: number | undefined;

/** @internal Test seam — shortens the auth timeout; `null` restores it. */
export const _setTestAuthRequestTimeoutMs = authRequestTimeoutMs.set;

function untilAuthDeadline(deadlineAt: number): AbortSignal {
  return AbortSignal.timeout(Math.max(0, deadlineAt - performance.now()));
}

type NotPromise<T> = T extends PromiseLike<unknown> ? never : T;

/**
 * Keeps `load` out of the deadline: reading the auth key can show a keychain dialog, which waits for
 * the user and blocks the process. The LKRP calls after it get the time that was left. `load` must
 * block synchronously: the time it takes is measured around the call and added to the deadline.
 */
export function excludeFromAuthDeadline<T>(load: () => T & NotPromise<T>): () => T {
  return () => {
    const startedAt = performance.now();
    const loaded = load();
    if (loaded instanceof Promise) {
      throw new TypeError("excludeFromAuthDeadline: load must be synchronous");
    }
    if (authDeadlineAt !== undefined) authDeadlineAt += performance.now() - startedAt;
    return loaded;
  };
}

// LKRP sends its OIDC calls through live-network's axios, which only times out GETs.
axios.interceptors.request.use(config => {
  if (config.url?.includes("/openid/v1/") && authDeadlineAt !== undefined) {
    config.signal ??= untilAuthDeadline(authDeadlineAt);
  }
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
  authDeadlineAt = undefined;
  // Every token fetch starts with this challenge request, so its deadline also bounds the redirect
  // hops and the LKRP calls after it.
  return (input, init) => {
    authDeadlineAt = performance.now() + authRequestTimeoutMs.get();
    return cookieFetch(input, { ...init, signal: untilAuthDeadline(authDeadlineAt) });
  };
}
