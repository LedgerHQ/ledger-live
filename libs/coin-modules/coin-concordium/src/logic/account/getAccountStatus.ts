import { getAccountsByPublicKey } from "../../network/proxyClient";
import type { ConcordiumCoinConfig } from "../../types";

export type ConcordiumAccountStatus = { used: boolean; isOnboarded: boolean };

/** A public key with an account on chain is onboarded and used, as the sync decides. */
export async function getAccountStatus(
  config: ConcordiumCoinConfig,
  currencyId: string,
  publicKey: string,
): Promise<ConcordiumAccountStatus> {
  const accounts = await getAccountsByPublicKey(config, currencyId, publicKey);
  const onChain = !!accounts?.length;
  return { used: onChain, isOnboarded: onChain };
}
