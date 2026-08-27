import { createRandomBase64Url, sha256Base64Url } from "./crypto";
import type { PayCardAuthorizeAttempt } from "./types";

/**
 * RFC 7636 allows verifiers between 43 and 128 characters. Encoding 32 random bytes as
 * unpadded base64url gives the minimum 43-character verifier with 256 bits of entropy.
 */
const CODE_VERIFIER_BYTE_LENGTH = 32;

/**
 * Builds one login attempt: a PKCE pair.
 *
 * The challenge travels on the authorize URL and the verifier stays on disk. The provider ties the
 * code it issues to that challenge, so only this attempt can exchange it. That binding is what makes
 * a separate CSRF value unnecessary.
 */
export async function createAuthorizeAttempt(): Promise<PayCardAuthorizeAttempt> {
  const codeVerifier = await createRandomBase64Url(CODE_VERIFIER_BYTE_LENGTH);

  return { codeVerifier, codeChallenge: await sha256Base64Url(codeVerifier) };
}
