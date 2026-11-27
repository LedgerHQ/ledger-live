import { getAccountNonce } from "../../network/proxyClient";
import type { ConcordiumCoinConfig } from "../../types";

export async function getNextValidSequence(
  config: ConcordiumCoinConfig,
  address: string,
): Promise<number> {
  const result = await getAccountNonce(config, address);
  return result.nonce;
}
