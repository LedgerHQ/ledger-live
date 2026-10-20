import { asBoolean, asRecord, asString, redactBody, redactSecretsInText } from "../http/body";
import { ENV_VARS } from "../config";
import { BaanxNoTokenError, BaanxOnboardingIncompleteError, BaanxOtpError } from "../errors";
import { resolveExpiry } from "./expiry";
import { sendJson, toTypedError, type BaanxResponse } from "../http/send";
import { buildTotp, generateFreshTotpCode, normalizeBase32, systemClock } from "./totp";
import { MIN_WINDOW_REMAINING_MS } from "../types";
import type { BaanxAuthSession, FetchImpl, LoginDeps, ResolvedBaanxAuthConfig } from "../types";

/**
 * The login flow.
 *
 * Baanx answers **HTTP 200 even when login has not completed**, so every
 * decision below branches on the response body. The status code is only
 * consulted to map hard failures.
 */

const LOGIN_PATH = "/v1/auth/login";

export async function loginToBaanx(
  config: ResolvedBaanxAuthConfig,
  deps: LoginDeps = {},
): Promise<BaanxAuthSession> {
  const fetchImpl = deps.fetchImpl ?? globalThis.fetch;
  const { email, password } = config;

  const first = await post(
    config,
    LOGIN_PATH,
    { email, password },
    fetchImpl,
    [],
    deps.requestTimeoutMs,
  );

  const secrets = secretsOf(config);
  const phase = redactSecretsInText(asString(asRecord(first.body).phase) ?? "", secrets);
  if (phase) {
    throw new BaanxOnboardingIncompleteError(phase, asString(asRecord(first.body).userId));
  }

  if (asRecord(first.body).isOtpRequired === true) {
    return completeOtpChallenge(config, deps, fetchImpl);
  }

  return toSession(config, first.body, { otpUsed: false });
}

/** Derive the authenticator code and re-post the login with `otpCode` only. */
async function completeOtpChallenge(
  config: ResolvedBaanxAuthConfig,
  deps: LoginDeps,
  fetchImpl: FetchImpl,
): Promise<BaanxAuthSession> {
  buildTotp(config.totp);

  const { code } = await generateFreshTotpCode(
    config.totp,
    deps.clock ?? systemClock,
    deps.minWindowRemainingMs ?? MIN_WINDOW_REMAINING_MS,
  );

  const retry = await post(
    config,
    LOGIN_PATH,
    { email: config.email, password: config.password, otpCode: code },
    fetchImpl,
    // The package promises generated codes never reach an error message, and an
    // API that echoes `otpCode` back would otherwise break that.
    [code],
    deps.requestTimeoutMs,
  );

  const secrets = [...secretsOf(config), code];
  const phase = redactSecretsInText(asString(asRecord(retry.body).phase) ?? "", secrets);
  if (phase) {
    throw new BaanxOnboardingIncompleteError(phase, asString(asRecord(retry.body).userId));
  }

  // A second challenge means the code was not accepted. Retrying would just
  // burn attempts and risk locking the account, so stop here.
  if (asRecord(retry.body).isOtpRequired === true) {
    throw new BaanxOtpError(
      "Baanx still requires an OTP after the generated code was submitted. The code was rejected — " +
        `check that ${ENV_VARS.totpSecret} is this user's setup key and that the digits/period/algorithm ` +
        `match how the authenticator was enrolled.`,
      redactBody(retry.body, [...secretsOf(config), code]),
    );
  }

  return toSession(config, retry.body, { otpUsed: true, extraSecrets: [code] });
}

/** Values that must never survive into an error message. */
function secretsOf(config: ResolvedBaanxAuthConfig): readonly string[] {
  const normalizedTotpSecret = normalizeBase32(config.totp.secret);
  const totpSecrets =
    normalizedTotpSecret === config.totp.secret
      ? [config.totp.secret]
      : [config.totp.secret, normalizedTotpSecret];

  return [config.clientKey, config.password, ...totpSecrets];
}

/**
 * Tokens that are technically non-empty strings but are plainly not tokens.
 *
 * A gateway that serialises a null token as the *string* "null" would otherwise
 * pass the emptiness check and produce a literal `Authorization: Bearer null`,
 * which is the exact failure this package exists to prevent.
 */
const TOKEN_SENTINELS = new Set(["null", "undefined", "nil", "none", "false", "0"]);

function isUsableToken(token: string | null): token is string {
  return token !== null && !TOKEN_SENTINELS.has(token.trim().toLowerCase());
}

/** Build the session, or refuse to — this is what stops `Bearer null`. */
function toSession(
  config: ResolvedBaanxAuthConfig,
  body: unknown,
  { otpUsed, extraSecrets = [] }: { otpUsed: boolean; extraSecrets?: readonly string[] },
): BaanxAuthSession {
  const payload = asRecord(body);
  const accessToken = asString(payload.accessToken)?.trim() ?? null;
  const secrets = [...secretsOf(config), ...extraSecrets];

  // `asString` rejects null, undefined, "" and whitespace; `isUsableToken`
  // additionally rejects string sentinels like "null", so a token reaching
  // `Bearer` is always something real.
  if (!isUsableToken(accessToken)) {
    throw new BaanxNoTokenError(redactBody(body, secrets));
  }

  const issuedAt = new Date();
  const { expiresAt, source } = resolveExpiry(accessToken, issuedAt);

  return {
    accessToken,
    userId: asString(payload.userId),
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    expirySource: source,
    otpUsed,
    verificationState:
      redactSecretsInText(asString(payload.verificationState) ?? "", secrets) || null,
    isLinked: asBoolean(payload.isLinked),
    baseUrl: config.baseUrl,
    region: config.region,
    email: config.email,
  };
}

async function post(
  config: ResolvedBaanxAuthConfig,
  path: string,
  body: Record<string, unknown>,
  fetchImpl: FetchImpl,
  /** Extra values to scrub, e.g. the generated OTP code on the retry. */
  extraSecrets: readonly string[] = [],
  requestTimeoutMs?: number,
): Promise<BaanxResponse> {
  const secrets = [...secretsOf(config), ...extraSecrets];
  const response = await sendJson({
    baseUrl: config.baseUrl,
    path,
    clientKey: config.clientKey,
    region: config.region,
    body,
    fetchImpl,
    secrets,
    requestTimeoutMs,
  });

  if (!response.ok) throw toTypedError(response, secrets);

  return response;
}
