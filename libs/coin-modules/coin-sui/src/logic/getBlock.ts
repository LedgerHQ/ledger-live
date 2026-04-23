import { Block, BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getBlock as sdkGetBlock, getBlockInfo as sdkGetBlockInfo } from "../network/sdk";

/**
 * Get a checkpoint (a.k.a, a block) metadata only.
 *
 * @param height the checkpoint sequence number
 * @see {@link getBlock}
 */
export async function getBlockInfo(height: number, currencyId?: string): Promise<BlockInfo> {
  return sdkGetBlockInfo(height.toString(), currencyId);
}

/**
 * Get a checkpoint (a.k.a, a block) metadata only.
 *
 * @param height the checkpoint sequence number
 * @see {@link getBlockInfo}
 */
export async function getBlock(height: number, currencyId?: string): Promise<Block> {
  return sdkGetBlock(height.toString(), currencyId);
}
