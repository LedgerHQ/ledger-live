import { getAccountNonce } from "../../network/proxyClient";

export async function getNextValidSequence(address: string, currencyId: string): Promise<number> {
  const result = await getAccountNonce(currencyId, address);
  return result.nonce;
}
