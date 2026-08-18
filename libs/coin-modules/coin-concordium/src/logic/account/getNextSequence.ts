import { getAccountNonce } from "../../network/proxyClient";
import type { ConcordiumCoinConfig } from "../../types";

export async function getNextValidSequence(
  config: ConcordiumCoinConfig,
  address: string,
  currencyId: string,
): Promise<number> {
  const result = await getAccountNonce(config, currencyId, address);
  return result.nonce;
}
