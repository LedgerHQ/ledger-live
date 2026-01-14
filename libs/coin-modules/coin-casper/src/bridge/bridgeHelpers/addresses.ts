import { Account } from "@ledgerhq/types-live";
import { PublicKey, KeyAlgorithm } from "casper-js-sdk";

export const getAddress = (
  a: Account,
): {
  address: string;
  derivationPath: string;
} => ({ address: a.freshAddress, derivationPath: a.freshAddressPath });

export function isAddressValid(pubKey: string): boolean {
  const checksummed = pubKey.toLowerCase() !== pubKey && pubKey.toUpperCase() !== pubKey;
  try {
    PublicKey.fromHex(pubKey, checksummed).accountHash().toHex();
    return true;
  } catch {
    return false;
  }
}

export function casperAccountHashFromPublicKey(pubKey: string): string {
  return PublicKey.fromHex(pubKey).accountHash().toHex();
}

export function casperAddressFromPubKey(pubkey: Buffer, keySig: KeyAlgorithm): string {
  return `${keySig.toString().padStart(2, "0")}${Buffer.from(pubkey).toString("hex")}`;
}
