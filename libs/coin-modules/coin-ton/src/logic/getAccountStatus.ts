import type { TonContext } from "../config";
import { addressFromPublicKey } from "./address";
import { isUsed } from "./isUsed";

export async function getAccountStatus(
  context: TonContext,
  publicKey: string,
  options: { blacklistedTokenIds?: readonly string[] } = {},
): Promise<{ used: boolean }> {
  return {
    used: await isUsed(context, addressFromPublicKey(publicKey), options.blacklistedTokenIds),
  };
}
