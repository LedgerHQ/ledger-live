import { bech32 } from "bech32";
import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";

/**
 * Encodes a Terra Classic address (bech32, terra1...) from a secp256k1 public key.
 * @param publicKey (Uint8Array) secp256k1 compressed public key (usually 33 bytes)
 * @returns bech32 terra classic address ("terra1...")
 */
export const encodeTerraAddress = (publicKey: Uint8Array): string => {
  // Step 1: SHA-256 hash of the public key
  const sha256Hash = sha256(publicKey);
  // Step 2: RIPEMD-160 hash of the SHA-256 hash
  const ripemd160Hash = ripemd160(sha256Hash);
  // Step 3: bech32 with "terra" prefix
  return bech32.encode("terra", bech32.toWords(ripemd160Hash));
};
