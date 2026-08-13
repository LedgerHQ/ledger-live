import { fetchNonce } from "../../network/api";

/** Stacks has a real sequential account nonce (unlike Tron/VeChain), so this is a genuine value. */
export async function getNextSequence(address: string): Promise<bigint> {
  const { possible_next_nonce } = await fetchNonce(address);
  return BigInt(possible_next_nonce);
}
