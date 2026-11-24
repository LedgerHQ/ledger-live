import { getAccountsByPublicKey } from "../../network/proxyClient";
import type { ConcordiumCoinConfig } from "../../types";

export type ConcordiumAccountStatus = { used: boolean; isOnboarded: boolean };

export async function getAccountStatus(
  config: ConcordiumCoinConfig,
  currencyId: string,
  publicKey: string,
  signal?: AbortSignal,
): Promise<ConcordiumAccountStatus> {
  const accounts = await getAccountsByPublicKey(config, currencyId, publicKey, signal);
  const onChain = !!accounts?.length;
  return { used: onChain, isOnboarded: onChain };
}
