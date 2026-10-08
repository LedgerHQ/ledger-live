export function isHexadecimal(str: string): boolean {
  return /^[A-F0-9]+$/i.test(str);
}

export function base64UrlDecode(base64Url: string): Buffer {
  // React Native Hermes engine does not support Buffer.from(value, "base64url")
  return Buffer.from(base64Url.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}
