import { sha256 } from "@noble/hashes/sha2";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const CHECKSUM_BYTES = 4;

function base58Bytes(text: string): number[] | undefined {
  let value = 0n;
  for (const char of text) {
    const digit = ALPHABET.indexOf(char);
    if (digit < 0) return undefined;
    value = value * 58n + BigInt(digit);
  }
  const bytes: number[] = [];
  for (; value > 0n; value /= 256n) bytes.unshift(Number(value % 256n));
  const leadingZeros = text.length - text.replace(/^1+/, "").length;
  return [...new Array<number>(leadingZeros).fill(0), ...bytes];
}

/** The payload of a Base58Check string; undefined when a character or the checksum is wrong. */
export function base58CheckPayload(text: string): Uint8Array | undefined {
  const bytes = base58Bytes(text);
  if (!bytes || bytes.length <= CHECKSUM_BYTES) return undefined;
  const payload = Uint8Array.from(bytes.slice(0, -CHECKSUM_BYTES));
  const expected = sha256(sha256(payload)).slice(0, CHECKSUM_BYTES);
  const checksum = bytes.slice(-CHECKSUM_BYTES);
  return expected.every((byte, index) => byte === checksum[index]) ? payload : undefined;
}
