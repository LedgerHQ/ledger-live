import { getAccountNonce } from "../../network/proxyClient";
import type { ConcordiumCoinConfig } from "../../types";

export async function getNextValidSequence(
  address: string,
  currencyId: string,
  config?: ConcordiumCoinConfig,
): Promise<number> {
  const result = await getAccountNonce(currencyId, address, config);
  return result.nonce;
}
