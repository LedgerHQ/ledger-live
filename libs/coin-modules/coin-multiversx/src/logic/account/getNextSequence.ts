import type { MultiversXNetworkApi } from "../../network/api";

/**
 * Returns the next usable nonce (sequence) for a MultiversX account.
 */
export async function getNextSequence(api: MultiversXNetworkApi, address: string): Promise<bigint> {
  const nonce = await api.getAccountNonce(address);
  return BigInt(nonce);
}
