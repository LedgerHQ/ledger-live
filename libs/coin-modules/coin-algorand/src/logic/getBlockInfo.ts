import { BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { AlgorandContext } from "../config";
import { getBlock } from "../network";

/**
 * Get block info for a specific height
 * @param context - The coin-module context (config + logger)
 * @param height - The block height (round number)
 * @returns Block info with height, hash, and time
 */
export async function getBlockInfo(context: AlgorandContext, height: number): Promise<BlockInfo> {
  const config = await context.config();
  const blockData = await getBlock(config, height);

  return {
    height,
    hash: blockData.block.gh,
    time: new Date(blockData.block.ts * 1000),
  };
}
