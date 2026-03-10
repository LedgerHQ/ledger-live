import { log } from "@ledgerhq/logs";
import type { BlockhashWithExpiryBlockHeight } from "@solana/web3.js";
import { SolanaTxConfirmationTimeout, SolanaTxSimulationFailedWhilePendingOp } from "../errors";
import type { ChainAPI } from "../network";

type BroadcastOptions = {
  recentBlockhash?: BlockhashWithExpiryBlockHeight;
  hasPendingOperations?: boolean;
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
  try {
    return await api.sendRawTransaction(buffer, options?.recentBlockhash);
  } catch (e) {
    if (e instanceof Error) {
      log("broadcast-error", e.message);

      if (e.message.includes("simulation failed") && options?.hasPendingOperations) {
        throw new SolanaTxSimulationFailedWhilePendingOp();
      }

      if (e.message.includes("was not confirmed in")) {
        throw new SolanaTxConfirmationTimeout();
      }
    }
    throw e;
  }
}
