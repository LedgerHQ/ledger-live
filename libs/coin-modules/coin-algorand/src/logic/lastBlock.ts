import { BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { AlgorandContext } from "../config";
import { getTransactionParams, getBlock } from "../network";

/**
 * Get the last confirmed block info
 * @param context - The coin-module context (config + logger)
 * @returns Block info with current round (height), hash, and time
 */
export async function lastBlock(context: AlgorandContext): Promise<BlockInfo> {
  const config = await context.config();
  const params = await getTransactionParams(config);
  const blockData = await getBlock(config, params.lastRound);

  return {
    height: params.lastRound,
    hash: blockData.block.gh,
    time: new Date(blockData.block.ts * 1000),
  };
}
