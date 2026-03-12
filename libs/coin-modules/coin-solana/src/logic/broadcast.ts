import type { BlockhashWithExpiryBlockHeight } from "@solana/web3.js";
import type { ChainAPI } from "../network";

type BroadcastOptions = {
  recentBlockhash?: BlockhashWithExpiryBlockHeight;
};

/**
 *
 * @param api - The Solana API client
 * @param tx - The transaction to broadcast in base64 format
 * @param options - The broadcast options
 * @returns The transaction hash
 */
export async function broadcast(
  api: ChainAPI,
  tx: string,
  options?: BroadcastOptions,
): Promise<string> {
  const buffer = Buffer.from(tx, "base64");
  return api.sendRawTransaction(buffer, options?.recentBlockhash);
}
