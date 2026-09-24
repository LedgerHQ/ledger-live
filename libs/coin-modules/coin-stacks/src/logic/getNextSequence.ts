import { fetchNonce } from "../network/api";
import type { StacksCurrencyConfig } from "../config";

/** Stacks has a real sequential account nonce (unlike Tron/VeChain), so this is a genuine value. */
export async function getNextSequence(
  config: StacksCurrencyConfig,
  address: string,
): Promise<bigint> {
  const { possible_next_nonce } = await fetchNonce(config, address);
  return BigInt(possible_next_nonce);
}
