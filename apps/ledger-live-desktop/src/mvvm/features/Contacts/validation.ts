import { LIMITS } from "./constants";

const PRINTABLE_ASCII = /^[\x20-\x7E]*$/;

export const isPrintableAscii = (value: string): boolean => PRINTABLE_ASCII.test(value);

/** Strips a leading `0x`/`0X` and lowercases. Does not validate length. */
export const normalizeAddressHex = (value: string): string =>
  value.trim().replace(/^0x/i, "").toLowerCase();

export const isValidAddressHex = (raw: string): boolean => {
  const v = normalizeAddressHex(raw);
  return v.length === LIMITS.addressHexChars && /^[0-9a-f]+$/.test(v);
};

/** True when `value` exceeds `maxLength` or contains non-printable-ASCII chars. */
export const isInvalidAsciiLabel = (value: string, maxLength: number): boolean =>
  value.length > maxLength || !isPrintableAscii(value);

/** True when `value` is non-empty AND fails address validation — empty is "neutral", not invalid. */
export const isInvalidPartialAddressHex = (value: string): boolean =>
  value.length > 0 && !isValidAddressHex(value);

/** Random 20-byte address with `0x` prefix — suitable for any EVM chain. Used by the AddressInput "refresh" affordance. */
export const randomAddressHex = (): string => {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return "0x" + Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
};
