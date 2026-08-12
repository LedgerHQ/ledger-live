import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";
import { normalizeAccountKey } from "./utils";

export function computeA4AccountVersion(addresses: string[]): string {
  const payload = addresses.map(normalizeAccountKey).sort().join("|");
  return bytesToHex(sha256(new TextEncoder().encode(payload)));
}
