import { ASSUMED_TOKEN_LIFETIME_MS } from "../types";

/**
 * When the token dies.
 *
 * There is no refresh token on the login endpoint — refresh tokens exist only
 * in Baanx's OAuth flow, and they rotate — so nothing here tries to renew. CI
 * re-authenticates per run instead.
 */

export interface ResolvedExpiry {
  expiresAt: Date;
  source: "token" | "assumed";
}

/**
 * Read `exp` out of a JWT payload without verifying the signature — we are only
 * reporting when the token dies, not trusting its claims.
 *
 * Returns null for anything that is not a readable JWT, in which case the
 * caller falls back to the documented 6-hour lifetime.
 */
export function readJwtExpiry(token: string): Date | null {
  const segments = token.split(".");
  if (segments.length !== 3) return null;

  try {
    const payload: unknown = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));

    if (
      typeof payload === "object" &&
      payload !== null &&
      "exp" in payload &&
      typeof (payload as { exp: unknown }).exp === "number"
    ) {
      const expiresAt = new Date((payload as { exp: number }).exp * 1_000);
      return Number.isNaN(expiresAt.getTime()) ? null : expiresAt;
    }
  } catch {
    // Not a JWT we can read. Deliberately silent: the payload must not be
    // logged, and the caller has a sane fallback.
  }

  return null;
}

export function resolveExpiry(accessToken: string, issuedAt: Date): ResolvedExpiry {
  const fromToken = readJwtExpiry(accessToken);
  if (fromToken) return { expiresAt: fromToken, source: "token" };

  return {
    expiresAt: new Date(issuedAt.getTime() + ASSUMED_TOKEN_LIFETIME_MS),
    source: "assumed",
  };
}
