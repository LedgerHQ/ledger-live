import { Secret, TOTP } from "otpauth";
import { BaanxTotpSecretError } from "../errors";
import { ENV_VARS } from "../config";
import { MIN_WINDOW_REMAINING_MS } from "../types";
import type { BaanxTotpConfig, TotpClock } from "../types";

/**
 * TOTP code generation for the test user's authenticator secret.
 *
 * Everything time-dependent goes through {@link TotpClock}, so tests pin the
 * clock and never wait on wall time. The secret itself is never logged and
 * never appears in a thrown message.
 */

export const systemClock: TotpClock = {
  now: () => Date.now(),
  sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
};

export interface TotpWindow {
  /** The RFC 6238 time counter for this window. */
  counter: number;
  startsAt: number;
  endsAt: number;
  /** How long this code stays valid. */
  remainingMs: number;
}

export function totpWindow(periodSeconds: number, nowMs: number): TotpWindow {
  const periodMs = periodSeconds * 1_000;
  const counter = Math.floor(nowMs / periodMs);
  const startsAt = counter * periodMs;

  return {
    counter,
    startsAt,
    endsAt: startsAt + periodMs,
    remainingMs: startsAt + periodMs - nowMs,
  };
}

/**
 * Generate the code for the window containing `timestampMs`.
 *
 * Exported for tests, which drive it with fixed timestamps and RFC 6238
 * vectors. Production code should prefer {@link generateFreshTotpCode}.
 */
export function generateTotpCodeAt(config: Required<BaanxTotpConfig>, timestampMs: number): string {
  return buildTotp(config).generate({ timestamp: timestampMs });
}

export interface FreshTotpCode {
  code: string;
  /** When this code stops being valid. */
  windowEndsAt: number;
  /** How long we waited for a window rollover. `0` when the first one was fine. */
  waitedMs: number;
}

/**
 * Produce a code with enough life left to survive the round trip.
 *
 * If the current window is about to roll over we wait for the next one instead
 * of sending a code that expires in flight — Baanx would reject it and the run
 * would look like a credentials failure. This is a real source of flaky e2e
 * auth, so it is handled here rather than left to the caller.
 */
export async function generateFreshTotpCode(
  config: Required<BaanxTotpConfig>,
  clock: TotpClock = systemClock,
  minRemainingMs: number = MIN_WINDOW_REMAINING_MS,
): Promise<FreshTotpCode> {
  const totp = buildTotp(config);

  const startedAt = clock.now();
  let at = startedAt;
  let window = totpWindow(config.period, at);

  if (window.remainingMs < minRemainingMs) {
    // Sleeping exactly the remainder lands us in the next window with a full
    // period ahead. Re-read the clock rather than assuming the sleep was exact.
    await clock.sleep(window.remainingMs);
    at = clock.now();
    window = totpWindow(config.period, at);
  }

  return {
    code: totp.generate({ timestamp: at }),
    windowEndsAt: window.endsAt,
    waitedMs: at - startedAt,
  };
}

function buildTotp(config: Required<BaanxTotpConfig>): TOTP {
  let secret: Secret;
  try {
    secret = Secret.fromBase32(normalizeBase32(config.secret));
  } catch {
    // Deliberately not chaining the original error: it may quote the secret.
    throw new BaanxTotpSecretError(ENV_VARS.totpSecret);
  }

  return new TOTP({
    algorithm: config.algorithm,
    digits: config.digits,
    period: config.period,
    secret,
  });
}

/** Setup keys are shown in spaced, lower-case or padded forms. All are fine. */
function normalizeBase32(secret: string): string {
  return secret.replace(/[\s-]/g, "").replace(/=+$/, "").toUpperCase();
}
