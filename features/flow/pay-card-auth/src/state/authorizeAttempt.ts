import { createRandomBase64Url, sha256Base64Url } from "./crypto";
import type { PayCardAuthorizeAttemptDraft } from "./types";

/** 32 bytes give 43 base64url characters — the shortest verifier RFC 7636 allows. */
const CODE_VERIFIER_BYTE_LENGTH = 32;

/** 16 bytes give 22 base64url characters, well past the 8 the backend requires. */
const STATE_BYTE_LENGTH = 16;

/**
 * Builds one login attempt: a CSRF `state` plus a PKCE pair.
 *
 * Both halves are minted here so an attempt is always internally consistent — the `state` the
 * callback must echo and the verifier the token exchange must present belong to the same login. The
 * challenge is sent to the authorize initiation; only the `state` and the verifier are worth keeping
 * afterwards, which is what {@link PayCardAuthorizeAttempt} holds.
 */
export async function createAuthorizeAttempt(): Promise<PayCardAuthorizeAttemptDraft> {
  const [state, codeVerifier] = await Promise.all([
    createRandomBase64Url(STATE_BYTE_LENGTH),
    createRandomBase64Url(CODE_VERIFIER_BYTE_LENGTH),
  ]);

  return { state, codeVerifier, codeChallenge: await sha256Base64Url(codeVerifier) };
}
