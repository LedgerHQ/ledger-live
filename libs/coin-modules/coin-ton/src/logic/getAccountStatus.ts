import type { TonContext } from "../config";
import { addressFromPublicKey } from "./address";
import { isUsed } from "./isUsed";

const ED25519_PUBLIC_KEY = /^[0-9a-f]{64}$/i;

export async function getAccountStatus(
  context: TonContext,
  publicKey: string,
  options: { blacklistedTokenIds?: readonly string[] } = {},
): Promise<{ used: boolean }> {
  if (!ED25519_PUBLIC_KEY.test(publicKey)) {
    throw new Error("[ton] getAccountStatus takes a 32-byte hex public key");
  }
  return {
    used: await isUsed(context, addressFromPublicKey(publicKey), options.blacklistedTokenIds),
  };
}
