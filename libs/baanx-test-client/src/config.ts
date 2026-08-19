import { BaanxConfigError, BaanxInvalidConfigError } from "./errors";
import {
  DEFAULT_BAANX_BASE_URL,
  DEFAULT_TOTP_ALGORITHM,
  DEFAULT_TOTP_DIGITS,
  DEFAULT_TOTP_PERIOD_S,
} from "./types";
import type { BaanxAuthConfig, BaanxRegion, ResolvedBaanxAuthConfig, TotpAlgorithm } from "./types";

/**
 * Turning explicit config plus environment variables into a runnable config.
 *
 * Credentials, the client key and the TOTP secret come from the environment
 * only. They are never accepted as CLI flags — flags land in process lists and
 * shell history — never read from a committed fixture, and never written to
 * disk. Explicit values passed by a caller win over the environment, which
 * keeps tests hermetic without wiring anything into the apps' `shared/env`.
 */

/** Every variable this package reads. Names are safe to print; values are not. */
export const ENV_VARS = {
  baseUrl: "BAANX_API_BASE_URL",
  clientKey: "BAANX_CLIENT_KEY",
  email: "BAANX_TEST_USER_EMAIL",
  password: "BAANX_TEST_USER_PASSWORD",
  totpSecret: "BAANX_TEST_USER_TOTP_SECRET",
  region: "BAANX_TEST_USER_REGION",
  totpDigits: "BAANX_TOTP_DIGITS",
  totpPeriod: "BAANX_TOTP_PERIOD",
  totpAlgorithm: "BAANX_TOTP_ALGORITHM",
} as const;

const TOTP_ALGORITHMS = new Set<string>(["SHA1", "SHA256", "SHA512"]);

/** Just the environment; injected in tests so nothing depends on the real one. */
export type EnvSource = Record<string, string | undefined>;

export function resolveBaanxAuthConfig(
  overrides: Partial<BaanxAuthConfig> = {},
  env: EnvSource = process.env,
): ResolvedBaanxAuthConfig {
  const clientKey = overrides.clientKey ?? read(env, ENV_VARS.clientKey);
  const email = overrides.email ?? read(env, ENV_VARS.email);
  // Not trimmed: trailing whitespace may genuinely be part of a password.
  const password = overrides.password ?? env[ENV_VARS.password];
  const totpSecret = overrides.totp?.secret ?? read(env, ENV_VARS.totpSecret);

  const missing: string[] = [];
  if (!clientKey) missing.push(ENV_VARS.clientKey);
  if (!email) missing.push(ENV_VARS.email);
  if (!password) missing.push(ENV_VARS.password);
  if (!totpSecret) missing.push(ENV_VARS.totpSecret);
  if (missing.length > 0) throw new BaanxConfigError(missing);

  const baseUrl = overrides.baseUrl ?? read(env, ENV_VARS.baseUrl) ?? DEFAULT_BAANX_BASE_URL;

  return {
    // A trailing slash would double up against the "/v1/..." paths.
    baseUrl: baseUrl.replace(/\/+$/, ""),
    clientKey: clientKey as string,
    email: email as string,
    password: password as string,
    region: resolveRegion(overrides.region, env),
    totp: {
      secret: totpSecret as string,
      digits:
        overrides.totp?.digits ??
        readInt(env, ENV_VARS.totpDigits, "a digit count between 6 and 10", 6, 10) ??
        DEFAULT_TOTP_DIGITS,
      period:
        overrides.totp?.period ??
        readInt(env, ENV_VARS.totpPeriod, "a period in seconds between 1 and 300", 1, 300) ??
        DEFAULT_TOTP_PERIOD_S,
      algorithm: resolveAlgorithm(overrides.totp?.algorithm, env),
    },
  };
}

function read(env: EnvSource, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

function resolveRegion(override: BaanxRegion | undefined, env: EnvSource): BaanxRegion {
  if (override) return override;

  const raw = read(env, ENV_VARS.region)?.toLowerCase();
  if (!raw) return "international";
  if (raw === "us" || raw === "international") return raw;

  throw new BaanxInvalidConfigError(ENV_VARS.region, `"international" or "us"`);
}

function resolveAlgorithm(override: TotpAlgorithm | undefined, env: EnvSource): TotpAlgorithm {
  if (override) return override;

  const raw = read(env, ENV_VARS.totpAlgorithm)?.toUpperCase();
  if (!raw) return DEFAULT_TOTP_ALGORITHM;
  if (TOTP_ALGORITHMS.has(raw)) return raw as TotpAlgorithm;

  throw new BaanxInvalidConfigError(ENV_VARS.totpAlgorithm, `one of SHA1, SHA256, SHA512`);
}

function readInt(
  env: EnvSource,
  name: string,
  expected: string,
  min: number,
  max: number,
): number | undefined {
  const raw = read(env, name);
  if (!raw) return undefined;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new BaanxInvalidConfigError(name, expected);
  }

  return parsed;
}
