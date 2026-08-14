import type { PayCardStoredAttempt } from "../types";

/**
 * One key holds one attempt. Both halves must travel together: the `state` the callback echoes and
 * the verifier the token exchange presents belong to the same login.
 */
export const PKCE_ATTEMPT_KEY = "payCard.pkce.attempt";

export function serializeAttempt(attempt: PayCardStoredAttempt): string {
  return JSON.stringify({ state: attempt.state, codeVerifier: attempt.codeVerifier });
}

/**
 * A payload that does not hold both halves is no attempt at all. Reading it as absent restarts the
 * login instead of sending a mismatched verifier to the token endpoint.
 */
export function parseAttempt(payload: string | null): PayCardStoredAttempt | null {
  if (!payload) {
    return null;
  }

  try {
    const { state, codeVerifier } = JSON.parse(payload) as Record<string, unknown>;
    return typeof state === "string" && state && typeof codeVerifier === "string" && codeVerifier
      ? { state, codeVerifier }
      : null;
  } catch {
    return null;
  }
}
