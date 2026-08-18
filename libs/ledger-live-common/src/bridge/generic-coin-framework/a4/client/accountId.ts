import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";
import { normalizeAccountKey } from "./utils";

export function deriveA4AccountId(xpubOrAddress: string): string {
  const textEncoder = new TextEncoder();

  return bytesToHex(sha256(textEncoder.encode(normalizeAccountKey(xpubOrAddress))));
}
