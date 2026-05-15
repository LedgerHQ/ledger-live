export function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const byteArray = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const binary = Array.from(byteArray).reduce((acc, byte) => acc + String.fromCharCode(byte), "");

  // Base64url alphabet required by PKCE S256. See: https://www.rfc-editor.org/rfc/rfc7636#appendix-A
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function stringToBytes(value: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(value);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

const RANDOM_VALUE_BYTE_LENGTH = 32;

export function createRandomBase64UrlValue(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(RANDOM_VALUE_BYTE_LENGTH));
  return bytesToBase64Url(bytes);
}

export function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([entryKey, entryValue]) => [entryKey, sortObject(entryValue)]),
    );
  }

  return value;
}
