import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { fromHex, normalizeSuiAddress } from "@mysten/sui/utils";

const ED25519_PUBLIC_KEY_HEX = /^[0-9a-f]{64}$/i;

/** True when `publicKeyHex` is a raw 32-byte Ed25519 key that derives `address`. */
export function suiPublicKeyMatchesAddress(publicKeyHex: string, address: string): boolean {
  if (!ED25519_PUBLIC_KEY_HEX.test(publicKeyHex)) return false;
  const derived = new Ed25519PublicKey(fromHex(publicKeyHex)).toSuiAddress();
  return normalizeSuiAddress(derived) === normalizeSuiAddress(address);
}
