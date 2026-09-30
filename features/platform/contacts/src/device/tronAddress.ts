import { sha256 } from "@noble/hashes/sha2";
import bs58 from "bs58";

const CHECKSUM_LENGTH = 4;
const TRON_ADDRESS_LENGTH = 21;
const TRON_ADDRESS_PREFIX = 0x41;

function checksum(payload: Uint8Array): Uint8Array {
  return sha256(sha256(payload)).subarray(0, CHECKSUM_LENGTH);
}

/**
 * Decodes a base58check Tron address (`T…`) to the 21-byte `0x41`-prefixed
 * form the device registers and the Tron signer provides, or `null` when it is
 * malformed (bad alphabet, bad checksum, wrong length or prefix).
 *
 * Mirrors the Tron signer kit's own decoder so the identifier bytes bound at
 * registration match the ones it sends when providing the contact.
 */
export function tryDecodeTronAddress(address: string): Uint8Array | null {
  let decoded: Uint8Array;
  try {
    decoded = Uint8Array.from(bs58.decode(address));
  } catch {
    return null;
  }

  if (decoded.length !== TRON_ADDRESS_LENGTH + CHECKSUM_LENGTH) return null;

  const payload = decoded.subarray(0, TRON_ADDRESS_LENGTH);
  const expectedChecksum = checksum(payload);
  const actualChecksum = decoded.subarray(TRON_ADDRESS_LENGTH);
  if (!actualChecksum.every((byte, index) => byte === expectedChecksum[index])) return null;

  return payload[0] === TRON_ADDRESS_PREFIX ? payload : null;
}
