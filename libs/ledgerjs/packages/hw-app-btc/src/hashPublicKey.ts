import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";
export function hashPublicKey(buffer: Buffer): Buffer {
  return Buffer.from(ripemd160(sha256(buffer)));
}
