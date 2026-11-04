import { BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { AlgorandContext } from "../config";
import { getTransactionParams } from "../network";
import { getBlockInfo } from "./getBlockInfo";

/**
 * Get the last confirmed block info
 * @param context - The coin-module context (config + logger)
 * @returns Block info with current round (height), hash, time and parent
 */
export async function lastBlock(context: AlgorandContext): Promise<BlockInfo> {
  const config = await context.config();
  const params = await getTransactionParams(config);

  return getBlockInfo(context, params.lastRound);
}
