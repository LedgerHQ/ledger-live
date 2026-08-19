import { Block, BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getBlock as sdkGetBlock, getBlockInfo as sdkGetBlockInfo } from "../network/sdk";
import type { SuiCoinConfig } from "../config";

/**
 * Get a checkpoint (a.k.a, a block) metadata only.
 *
 * @param height the checkpoint sequence number
 * @see {@link getBlock}
 */
export async function getBlockInfo(config: SuiCoinConfig, height: number): Promise<BlockInfo> {
  return sdkGetBlockInfo(config, height.toString());
}

/**
 * Get a checkpoint (a.k.a, a block) metadata plus its transactions.
 *
 * @param height the checkpoint sequence number
 * @see {@link getBlockInfo}
 */
export async function getBlock(config: SuiCoinConfig, height: number): Promise<Block> {
  return sdkGetBlock(config, height.toString());
}
