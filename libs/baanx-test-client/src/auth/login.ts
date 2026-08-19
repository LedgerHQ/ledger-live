import {
  asBoolean,
  asRecord,
  asString,
  extractApiMessage,
  looksAccountLocked,
  redactBody,
} from "../http/body";
import { ENV_VARS } from "../config";
import {
  BaanxHttpError,
  BaanxInvalidClientKeyError,
  BaanxInvalidCredentialsError,
  BaanxMissingClientKeyError,
  BaanxNoTokenError,
  BaanxOnboardingIncompleteError,
  BaanxOtpError,
  BaanxRateLimitError,
} from "../errors";
import { resolveExpiry } from "./expiry";
import { sendJson, toTypedError } from "../http/send";
import type { BaanxResponse } from "../http/send";
import { generateFreshTotpCode, systemClock } from "./totp";
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
const OTP_PATH = "/v1/auth/login/otp";

export async function loginToBaanx(
  config: ResolvedBaanxAuthConfig,
  deps: LoginDeps = {},
): Promise<BaanxAuthSession> {
  const fetchImpl = deps.fetchImpl ?? globalThis.fetch;
  const { email, password } = config;

  const first = await post(config, LOGIN_PATH, { email, password }, fetchImpl);

  const phase = asString(asRecord(first.body).phase);
  if (phase) {
    throw new BaanxOnboardingIncompleteError(phase, asString(asRecord(first.body).userId));
  }

  if (asRecord(first.body).isOtpRequired === true) {
    return completeOtpChallenge(config, first, deps, fetchImpl);
  }

  return toSession(config, first.body, { otpUsed: false });
}

/**
 * Answer the OTP challenge: trigger it, derive the code from the setup key, and
 * re-post the login. The retry carries no `phoneNumber` — only the code.
 */
async function completeOtpChallenge(
  config: ResolvedBaanxAuthConfig,
  first: BaanxResponse,
  deps: LoginDeps,
  fetchImpl: FetchImpl,
): Promise<BaanxAuthSession> {
  const userId = asString(asRecord(first.body).userId);
  if (!userId) {
    throw new BaanxOtpError(
      "Baanx asked for an OTP but returned no userId, so the challenge cannot be triggered.",
      redactBody(first.body),
    );
  }

  await triggerOtp(config, userId, fetchImpl);

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
  );

  const phase = asString(asRecord(retry.body).phase);
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
      redactBody(retry.body),
    );
  }

  return toSession(config, retry.body, { otpUsed: true });
}

async function triggerOtp(
  config: ResolvedBaanxAuthConfig,
  userId: string,
  fetchImpl: FetchImpl,
): Promise<void> {
  try {
    await post(config, OTP_PATH, { userId }, fetchImpl);
  } catch (error) {
    // A precisely-typed failure already explains itself — a 429, a rejected
    // client key or bad credentials are not mysteries about this endpoint, and
    // callers branch on those types. Only an otherwise-unexplained HTTP error
    // gets the authenticator hypothesis below.
    if (!(error instanceof BaanxHttpError)) throw error;

    // Baanx documents this endpoint as the SMS trigger. Our test users are
    // provisioned with an authenticator secret instead, so if it starts
    // failing, the trigger may simply not apply to them — say so rather than
    // letting it read as a generic outage.
    throw new BaanxOtpError(
      `Could not trigger the OTP challenge (${OTP_PATH}). ` +
        `If this user is authenticator-only, Baanx may not accept the trigger call for it. ` +
        `Underlying failure: ${error.message}`,
      error.body,
    );
  }
}

/** Build the session, or refuse to — this is what stops `Bearer null`. */
function toSession(
  config: ResolvedBaanxAuthConfig,
  body: unknown,
  { otpUsed }: { otpUsed: boolean },
): BaanxAuthSession {
  const payload = asRecord(body);
  const accessToken = asString(payload.accessToken);

  // `asString` rejects null, undefined, "" and whitespace, so a token here is
  // always something we can put behind `Bearer`.
  if (!accessToken) throw new BaanxNoTokenError(redactBody(body));

  const issuedAt = new Date();
  const { expiresAt, source } = resolveExpiry(accessToken, issuedAt);

  return {
    accessToken,
    userId: asString(payload.userId),
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    expirySource: source,
    otpUsed,
    verificationState: asString(payload.verificationState),
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
): Promise<BaanxResponse> {
  const response = await sendJson({
    baseUrl: config.baseUrl,
    path,
    clientKey: config.clientKey,
    region: config.region,
    body,
    fetchImpl,
  });

  if (!response.ok) throw toTypedError(response);

  return response;
}
