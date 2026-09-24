import { getBaanxAuthToken, type BaanxAuthTokenOptions } from "./auth/session";
import { CARD_SESSION_BOOTSTRAP_ENV, toPayCardSessionJson } from "./payCardSession";

export type ResolveCardSessionBootstrapOptions = BaanxAuthTokenOptions;

/**
 * PayCardSession JSON for an opted-in E2E launch.
 *
 * A set `CARD_SESSION_BOOTSTRAP` wins. Otherwise {@link getBaanxAuthToken} mints
 * one; its in-process cache coalesces concurrent callers and re-authenticates
 * before expiry.
 */
export async function resolveCardSessionBootstrap(
  options: ResolveCardSessionBootstrapOptions = {},
): Promise<string> {
  const { env, deps, forceRefresh, now, ...overrides } = options;
  const source = env ?? process.env;

  const preset = source[CARD_SESSION_BOOTSTRAP_ENV]?.trim();
  if (preset) return preset;

  const session = await getBaanxAuthToken({ env: source, deps, forceRefresh, now, ...overrides });
  return toPayCardSessionJson(session);
}
