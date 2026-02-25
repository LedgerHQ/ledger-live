import { BlockInfo } from "@ledgerhq/coin-framework/api/types";
import { getBlock } from "../network";

/**
 * Get block info for a specific height
 * @param height - The block height (round number)
 * @returns Block info with height, hash, and time
 */
export async function getBlockInfo(height: number): Promise<BlockInfo> {
  const blockData = await getBlock(height);

  return {
    height,
    hash: blockData.block.gh,
    time: new Date(blockData.block.ts * 1000),
  };
}
