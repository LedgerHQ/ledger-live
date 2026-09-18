import { createRandomBase64Url, sha256Base64Url } from "./crypto";
import type { PayCardAuthorizeAttempt } from "./types";

/**
 * RFC 7636 allows verifiers between 43 and 128 characters. Encoding 32 random bytes as
 * unpadded base64url gives the minimum 43-character verifier with 256 bits of entropy.
 */
const CODE_VERIFIER_BYTE_LENGTH = 32;

/** Only needs to be unique to this session, not cryptographically unguessable. */
const ATTEMPT_STATE_BYTE_LENGTH = 16;

/**
 * Builds one login attempt: a PKCE pair, and a local id for this attempt.
 *
 * The challenge travels on the authorize URL and the verifier stays on disk. The provider ties the
 * code it issues to that challenge, so only this attempt can exchange it. That binding is what makes
 * a separate CSRF value unnecessary.
 *
 * `state` travels on the authorize URL too, for a different reason: it comes back on the redirect,
 * so the app can tell a stray redirect from an attempt it has already abandoned apart from the one
 * it is currently waiting on.
 */
export async function createAuthorizeAttempt(): Promise<PayCardAuthorizeAttempt> {
  const [codeVerifier, state] = await Promise.all([
    createRandomBase64Url(CODE_VERIFIER_BYTE_LENGTH),
    createRandomBase64Url(ATTEMPT_STATE_BYTE_LENGTH),
  ]);

  return { codeVerifier, codeChallenge: await sha256Base64Url(codeVerifier), state };
}
