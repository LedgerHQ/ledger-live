const BASE64URL = /^[A-Za-z0-9_-]*$/;

export function encodeBase64Url(text: string): string {
  const binary = Array.from(new TextEncoder().encode(text), byte => String.fromCharCode(byte));
  return btoa(binary.join("")).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function decodeBase64Url(encoded: string): string {
  if (!BASE64URL.test(encoded)) throw new TypeError(`Invalid base64url ${encoded}`);
  const base64 = encoded.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
