import { Block, BlockInfo } from "@ledgerhq/coin-framework/lib/api/types";
import { getBlock as sdkGetBlock, getBlockInfo as sdkGetBlockInfo } from "../network/sdk";

/**
 * Get a checkpoint (a.k.a, a block) metadata only.
 *
 * @param height the checkpoint sequence number
 * @see {@link getBlock}
 */
export async function getBlockInfo(height: number): Promise<BlockInfo> {
  return sdkGetBlockInfo(height.toString());
}

/**
 * Get a checkpoint (a.k.a, a block) metadata only.
 *
 * @param height the checkpoint sequence number
 * @see {@link getBlockInfo}
 */
export async function getBlock(height: number): Promise<Block> {
  return sdkGetBlock(height.toString());
}
