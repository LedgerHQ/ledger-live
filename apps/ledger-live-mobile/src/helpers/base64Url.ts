export function bytesToBase64Url(bytes: Uint8Array): string {
  return toBase64Url(btoa(String.fromCodePoint(...bytes)));
}

export function toBase64Url(value: string): string {
  return value.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
