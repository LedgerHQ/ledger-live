import RIPEMD160 from "ripemd160";
import sha from "sha.js";
export function hashPublicKey(buffer: Buffer): Buffer {
  return new RIPEMD160().update(sha("sha256").update(buffer).digest()).digest();
}
