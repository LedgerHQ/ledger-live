import { getAccountsByPublicKey } from "../../network/proxyClient";
import type { ConcordiumContext } from "../../types";

export type ConcordiumAccountStatus = { activated: boolean; used: boolean };

export async function getAccountStatus(
  context: ConcordiumContext,
  publicKey: string,
  signal?: AbortSignal,
): Promise<ConcordiumAccountStatus> {
  const accounts = await getAccountsByPublicKey(context, publicKey, signal);
  const onChain = !!accounts?.length;
  return { activated: onChain, used: onChain };
}
