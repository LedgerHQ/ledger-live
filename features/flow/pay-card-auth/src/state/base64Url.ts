/**
 * OAuth carries these values in URLs, so both the PKCE verifier/challenge and the `state` are
 * base64url — the unpadded, URL-safe alphabet of RFC 4648 §5.
 */

export function bytesToBase64Url(bytes: Uint8Array): string {
  return toBase64Url(btoa(String.fromCodePoint(...bytes)));
}

export function toBase64Url(value: string): string {
  return value.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
