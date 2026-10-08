export function isHexadecimal(str: string): boolean {
  return /^[A-F0-9]+$/i.test(str);
}

const BASE64URL_TO_BASE64: Record<string, string> = { "-": "+", _: "/" };

export function base64UrlDecode(base64Url: string): Buffer {
  // React Native Hermes engine does not support Buffer.from(value, "base64url")
  const base64 = Array.from(base64Url, char => BASE64URL_TO_BASE64[char] ?? char).join("");
  return Buffer.from(base64, "base64");
}
