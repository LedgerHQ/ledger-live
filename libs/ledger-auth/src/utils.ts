import { jwtDecode } from "jwt-decode";
import type { TokenState } from "./types";

const REFRESH_SKEW = 5_000;

export function getTokenState(accessToken: string, now = Date.now()): TokenState {
  let exp: number | undefined;
  try {
    ({ exp } = jwtDecode(accessToken));
  } catch {
    return "invalid";
  }

  if (typeof exp !== "number") {
    return "invalid";
  }

  const expiresAt = exp * 1000;
  if (now >= expiresAt) {
    return "expired";
  }
  if (now >= expiresAt - REFRESH_SKEW) {
    return "stale";
  }
  return "valid";
}

export function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const byteArray = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

  // Base64url alphabet required by PKCE S256. See: https://www.rfc-editor.org/rfc/rfc7636#appendix-A
  return btoa(String.fromCodePoint(...byteArray))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function stringToBytes(value: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(value);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

const RANDOM_VALUE_BYTE_LENGTH = 32;

export function createRandomBase64UrlValue(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(RANDOM_VALUE_BYTE_LENGTH));
  return bytesToBase64Url(bytes);
}
