import RIPEMD160 from "ripemd160";
import sha from "sha.js";

export function sha256(buffer: Buffer | string) {
  return sha("sha256").update(buffer).digest();
}
export function hash256(buffer: Buffer | string) {
  return sha256(sha256(buffer));
}
export function ripemd160(buffer: Buffer | string) {
  return new RIPEMD160().update(buffer).digest();
}
export function hash160(buffer: Buffer | string) {
  return ripemd160(sha256(buffer));
}
