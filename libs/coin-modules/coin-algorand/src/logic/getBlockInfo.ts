import { BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { AlgorandContext } from "../config";
import { getBlock, getBlockHash } from "../network";

const PARENT_HASH_PREFIX = "blk-";

/**
 * Get block info for a specific height
 * @param context - The coin-module context (config + logger)
 * @param height - The block height (round number)
 * @returns Block info with height, hash, time and parent
 */
export async function getBlockInfo(context: AlgorandContext, height: number): Promise<BlockInfo> {
  const config = await context.config();
  const [blockData, hash] = await Promise.all([
    getBlock(config, height),
    getBlockHash(config, height),
  ]);
  const { prev, ts } = blockData.block;

  return {
    height,
    hash,
    time: new Date(ts * 1000),
    ...(prev ? { parent: { height: height - 1, hash: prev.replace(PARENT_HASH_PREFIX, "") } } : {}),
  };
}
