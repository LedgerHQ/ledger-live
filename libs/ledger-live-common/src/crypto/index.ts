import sha from "sha.js";

export function sha256(buffer: Buffer | string) {
  return sha("sha256").update(buffer).digest();
}
