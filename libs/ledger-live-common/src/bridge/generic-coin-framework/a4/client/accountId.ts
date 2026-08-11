import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";

export function normalizeAccountKey(xpubOrAddress: string): string {
  return /^0x[0-9a-fA-F]+$/.test(xpubOrAddress) ? xpubOrAddress.toLowerCase() : xpubOrAddress;
}

export function deriveA4AccountId(xpubOrAddress: string): string {
  const textEncoder = new TextEncoder();

  return bytesToHex(sha256(textEncoder.encode(normalizeAccountKey(xpubOrAddress))));
}
