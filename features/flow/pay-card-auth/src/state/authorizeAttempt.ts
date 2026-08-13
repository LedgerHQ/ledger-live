import { createRandomBase64Url, sha256Base64Url } from "./crypto";
import type { PayCardAuthorizeAttempt } from "./types";

/**
 * RFC 7636 allows verifiers between 43 and 128 characters. Encoding 32 random bytes as
 * unpadded base64url gives the minimum 43-character verifier with 256 bits of entropy.
 */
const CODE_VERIFIER_BYTE_LENGTH = 32;

/**
 * OAuth state has no fixed standard length. Encoding 16 random bytes as unpadded base64url gives
 * 22 characters and 128 bits of entropy, safely above the backend's 8-character minimum.
 */
const STATE_BYTE_LENGTH = 16;

/**
 * Builds one login attempt: a CSRF `state` plus a PKCE pair.
 *
 * Both halves are minted here so an attempt is always internally consistent — the `state` the
 * callback must echo and the verifier the token exchange must present belong to the same login. Only
 * the challenge is spent on the authorize initiation.
 */
export async function createAuthorizeAttempt(): Promise<PayCardAuthorizeAttempt> {
  const [state, codeVerifier] = await Promise.all([
    createRandomBase64Url(STATE_BYTE_LENGTH),
    createRandomBase64Url(CODE_VERIFIER_BYTE_LENGTH),
  ]);

  return { state, codeVerifier, codeChallenge: await sha256Base64Url(codeVerifier) };
}
