import type { PayCardStoredAttempt } from "../types";

/** One key holds one attempt: the PKCE verifier the token exchange presents. */
export const PKCE_ATTEMPT_KEY = "payCard.pkce.attempt";

export function serializeAttempt(attempt: PayCardStoredAttempt): string {
  return JSON.stringify({ codeVerifier: attempt.codeVerifier });
}

/**
 * A payload without a verifier is no attempt at all. Reading it as absent restarts the login instead
 * of sending an empty verifier to the token endpoint.
 */
export function parseAttempt(payload: string | null): PayCardStoredAttempt | null {
  if (!payload) {
    return null;
  }

  try {
    const { codeVerifier } = JSON.parse(payload) as Record<string, unknown>;
    return typeof codeVerifier === "string" && codeVerifier ? { codeVerifier } : null;
  } catch {
    return null;
  }
}
