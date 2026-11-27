import { getAccountsByPublicKey } from "../../network/proxyClient";
import type { ConcordiumCoinConfig } from "../../types";

export type ConcordiumAccountStatus = { activated: boolean; used: boolean };

export async function getAccountStatus(
  config: ConcordiumCoinConfig,
  publicKey: string,
  signal?: AbortSignal,
): Promise<ConcordiumAccountStatus> {
  const accounts = await getAccountsByPublicKey(config, publicKey, signal);
  const onChain = !!accounts?.length;
  return { activated: onChain, used: onChain };
}
