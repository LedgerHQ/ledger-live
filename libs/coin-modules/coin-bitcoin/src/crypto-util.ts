import { sha256 as nobleSha256 } from "@noble/hashes/sha256";
import { ripemd160 as nobleRipemd160 } from "@noble/hashes/ripemd160";

export function sha256(buffer: Buffer | string) {
  return Buffer.from(nobleSha256(buffer));
}
export function hash256(buffer: Buffer | string) {
  return sha256(sha256(buffer));
}
export function ripemd160(buffer: Buffer | string) {
  return Buffer.from(nobleRipemd160(buffer));
}
export function hash160(buffer: Buffer | string) {
  return ripemd160(sha256(buffer));
}
