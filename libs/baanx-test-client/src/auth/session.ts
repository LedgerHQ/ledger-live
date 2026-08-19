import { resolveBaanxAuthConfig } from "../config";
import type { EnvSource } from "../config";
import { loginToBaanx } from "./login";
import { TOKEN_REFRESH_MARGIN_MS } from "../types";
import type {
  BaanxAuthConfig,
  BaanxAuthSession,
  LoginDeps,
  ResolvedBaanxAuthConfig,
} from "../types";

/**
 * The entry point for test code, with an in-process token cache.
 *
 * A parallel suite must not log in once per worker — that is how you earn a
 * 429. Within one process, concurrent callers share a single login: the
 * in-flight promise is cached, not just its result. Across processes (Playwright
 * and Detox each fork workers) the cache cannot help, so hand the token down
 * from a `globalSetup`; see the README.
 *
 * Nothing is written to disk and nothing is logged — the token lives in module
 * memory for the lifetime of the process, like the app's own `cardSession`.
 */

export interface BaanxAuthTokenOptions extends Partial<BaanxAuthConfig> {
  /** Environment to read fallbacks from. Injected in tests. */
  env?: EnvSource;
  /** Transport and clock overrides. Tests pass a mocked `fetchImpl`. */
  deps?: LoginDeps;
  /** Ignore any cached token and authenticate again. */
  forceRefresh?: boolean;
  /** Clock used for cache-freshness checks. Injected in tests. */
  now?: () => number;
}

interface CacheEntry {
  session?: BaanxAuthSession;
  inFlight?: Promise<BaanxAuthSession>;
}

const cache = new Map<string, CacheEntry>();

export async function getBaanxAuthToken(
  options: BaanxAuthTokenOptions = {},
): Promise<BaanxAuthSession> {
  const { env, deps, forceRefresh, now = Date.now, ...overrides } = options;

  const config = resolveBaanxAuthConfig(overrides, env);
  const key = cacheKey(config);
  const entry = cache.get(key);

  if (!forceRefresh && entry) {
    if (entry.session && isFresh(entry.session, now())) return entry.session;
    // A login is already running for this user — join it instead of racing it.
    if (entry.inFlight) return entry.inFlight;
  }

  const inFlight = loginToBaanx(config, deps)
    .then(session => {
      cache.set(key, { session });
      return session;
    })
    .catch((error: unknown) => {
      // Drop the failed attempt so the next caller retries rather than
      // awaiting a promise that is already rejected.
      cache.delete(key);
      throw error;
    });

  cache.set(key, { ...entry, inFlight });

  return inFlight;
}

/**
 * Forget every cached token.
 *
 * For tests, and for a suite that deliberately wants a fresh login. Not needed
 * for expiry — that is handled automatically.
 */
export function clearBaanxAuthCache(): void {
  cache.clear();
}

/**
 * Keyed on who the token is for and where it came from — never on the password
 * or the setup key, which must not end up in a map key.
 */
function cacheKey(config: ResolvedBaanxAuthConfig): string {
  return [config.baseUrl, config.region, config.email].join("\0");
}

/** Treat a token as usable only while it has more than the margin left. */
function isFresh(session: BaanxAuthSession, nowMs: number): boolean {
  const expiresAt = Date.parse(session.expiresAt);
  if (Number.isNaN(expiresAt)) return false;

  return nowMs < expiresAt - TOKEN_REFRESH_MARGIN_MS;
}
