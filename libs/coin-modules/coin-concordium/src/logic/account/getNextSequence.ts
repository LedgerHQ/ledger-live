import { getAccountNonce } from "../../network/proxyClient";
import type { ConcordiumContext } from "../../types";

export async function getNextValidSequence(
  context: ConcordiumContext,
  address: string,
): Promise<number> {
  const result = await getAccountNonce(context, address);
  return result.nonce;
}
