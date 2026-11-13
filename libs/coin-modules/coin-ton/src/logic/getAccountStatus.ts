import type { TonContext } from "../config";
import { addressFromPublicKey } from "./address";
import { isUsed } from "./isUsed";

/** Whether the wallet of a public key was ever used; TON has no onboarding. */
export async function getAccountStatus(
  context: TonContext,
  publicKey: string,
  options: { blacklistedTokenIds?: readonly string[] } = {},
): Promise<{ used: boolean }> {
  return {
    used: await isUsed(context, addressFromPublicKey(publicKey), options.blacklistedTokenIds),
  };
}
