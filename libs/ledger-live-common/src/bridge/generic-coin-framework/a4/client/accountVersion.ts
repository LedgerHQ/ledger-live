import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";

export function computeA4AccountVersion(addresses: string[]): string {
  const payload = [...addresses].sort().join("|");
  return bytesToHex(sha256(new TextEncoder().encode(payload)));
}
