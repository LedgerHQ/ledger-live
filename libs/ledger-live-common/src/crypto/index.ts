import { sha256 as nobleSha256 } from "@noble/hashes/sha256";

export function sha256(buffer: Buffer | string) {
  return Buffer.from(nobleSha256(buffer));
}
