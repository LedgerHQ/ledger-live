import { sha256 } from "@noble/hashes/sha2";
import { keccak_256 } from "@noble/hashes/sha3";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58(bytes: Uint8Array): string {
  let value = bytes.reduce((acc, byte) => acc * 256n + BigInt(byte), 0n);
  let encoded = "";
  while (value > 0n) {
    encoded = ALPHABET[Number(value % 58n)] + encoded;
    value /= 58n;
  }
  const zeros = bytes.findIndex(byte => byte !== 0);
  return "1".repeat(zeros === -1 ? bytes.length : zeros) + encoded;
}

export function base58check(payload: Uint8Array): string {
  const checksum = sha256(sha256(payload)).slice(0, 4);
  return base58(Uint8Array.from([...payload, ...checksum]));
}

const hex = (bytes: Uint8Array) =>
  Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");

/** EIP-55 mixed-case address of 20 bytes. */
export function checksumAddress(bytes: Uint8Array): string {
  const lower = hex(bytes);
  const hash = hex(keccak_256(Uint8Array.from(lower, char => char.codePointAt(0) ?? 0)));
  const mixed = Array.from(lower, (char, index) =>
    Number.parseInt(hash[index], 16) >= 8 ? char.toUpperCase() : char,
  ).join("");
  return `0x${mixed}`;
}
