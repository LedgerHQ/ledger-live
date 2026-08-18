import { bytesToBase64Url } from "./base64Url";

/** Web half of the OAuth randomness: WebCrypto, available in the renderer. */

export async function createRandomBase64Url(byteLength: number): Promise<string> {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", asciiToBytes(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

/**
 * The only value digested here is a base64url PKCE verifier, so one byte per character holds. Doing
 * it by hand rather than through `TextEncoder` keeps this off a global that jsdom does not provide.
 */
function asciiToBytes(value: string) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index++) {
    bytes[index] = value.charCodeAt(index);
  }
  return bytes;
}
