import { getAccountsByPublicKey } from "../../network/proxyClient";
import type { ConcordiumCoinConfig } from "../../types";

export type ConcordiumAccountStatus = { activated: boolean; used: boolean };

export async function getAccountStatus(
  config: ConcordiumCoinConfig,
  currencyId: string,
  publicKey: string,
  signal?: AbortSignal,
): Promise<ConcordiumAccountStatus> {
  const accounts = await getAccountsByPublicKey(config, currencyId, publicKey, signal);
  const onChain = !!accounts?.length;
  return { activated: onChain, used: onChain };
}
