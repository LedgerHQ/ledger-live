import { resolveBaanxAuthConfig } from "./config";
import { sendJson, toTypedError } from "./http/send";
import type { FetchImpl } from "./types";
import { getBaanxAuthToken } from "./auth/session";
import type { BaanxAuthTokenOptions } from "./auth/session";

/**
 * Authenticated requests to the Baanx API, for data creation and validation in
 * tests.
 *
 * Endpoint-agnostic on purpose: it owns authentication, headers, error mapping
 * and token reuse, and leaves the endpoints to the caller. Every call reuses
 * the cached token, so a suite doing setup across many calls logs in once.
 */

export interface BaanxRequestOptions {
  /** Path beginning with a slash, e.g. "/v1/user". */
  path: string;
  /** Defaults to `GET`. */
  method?: string;
  /** Serialised as JSON. Omit for GET-style calls. */
  body?: unknown;
  /** Appended as a query string; `undefined` values are dropped. */
  query?: Record<string, string | number | boolean | undefined>;
  /** Extra headers, merged over the ones we set. */
  headers?: Record<string, string>;
  /** Config overrides and env/transport injection, as `getBaanxAuthToken`. */
  auth?: BaanxAuthTokenOptions;
  /** Escape hatch for tests; defaults to the global `fetch`. */
  fetchImpl?: FetchImpl;
}

export interface BaanxApiResponse<T> {
  status: number;
  data: T;
}

/**
 * Perform an authenticated request, throwing the package's typed errors on a
 * non-2xx so a failure during data setup reads the same as one during login.
 *
 * A `401` is retried exactly once against a freshly minted token — a long suite
 * can outlive a 6-hour token, and that should not read as a broken fixture.
 * This mirrors what the app's own Card base query does after a 401.
 */
export async function baanxRequest<T = unknown>({
  path,
  method = "GET",
  body,
  query,
  headers,
  auth = {},
  fetchImpl = globalThis.fetch,
}: BaanxRequestOptions): Promise<BaanxApiResponse<T>> {
  const config = resolveBaanxAuthConfig(stripRuntimeOptions(auth), auth.env);
  const fullPath = `${path}${buildQuery(query)}`;

  // The login this triggers must use the same transport as the request itself,
  // or injecting `fetchImpl` for a test would still send the login over the
  // real network. An explicit `auth.deps.fetchImpl` still wins.
  const authWithTransport: BaanxAuthTokenOptions = {
    ...auth,
    deps: { fetchImpl, ...auth.deps },
  };

  const send = async (token: string) =>
    sendJson({
      baseUrl: config.baseUrl,
      path: fullPath,
      method,
      clientKey: config.clientKey,
      region: config.region,
      body,
      headers: { authorization: `Bearer ${token}`, ...headers },
      fetchImpl,
    });

  const session = await getBaanxAuthToken(authWithTransport);
  let response = await send(session.accessToken);

  if (response.status === 401) {
    const refreshed = await getBaanxAuthToken({ ...authWithTransport, forceRefresh: true });
    response = await send(refreshed.accessToken);
  }

  if (!response.ok) throw toTypedError(response);

  return { status: response.status, data: response.body as T };
}

/** `getBaanxAuthToken` options that are not part of the credential config. */
function stripRuntimeOptions(auth: BaanxAuthTokenOptions) {
  const { env: _env, deps: _deps, forceRefresh: _force, now: _now, ...overrides } = auth;
  return overrides;
}

function buildQuery(query: BaanxRequestOptions["query"]): string {
  if (!query) return "";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }

  const serialised = params.toString();
  return serialised ? `?${serialised}` : "";
}
