import { Block, BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getBlock as sdkGetBlock, getBlockInfo as sdkGetBlockInfo } from "../network/sdk";
import type { SuiCoinConfig } from "../config";

/**
 * Get a checkpoint (a.k.a, a block) metadata only.
 *
 * @param height the checkpoint sequence number
 * @see {@link getBlock}
 */
export async function getBlockInfo(
  height: number,
  currencyId?: string,
  config?: SuiCoinConfig,
): Promise<BlockInfo> {
  return sdkGetBlockInfo(height.toString(), currencyId, config);
}

/**
 * Get a checkpoint (a.k.a, a block) metadata only.
 *
 * @param height the checkpoint sequence number
 * @see {@link getBlockInfo}
 */
export async function getBlock(
  height: number,
  currencyId?: string,
  config?: SuiCoinConfig,
): Promise<Block> {
  return sdkGetBlock(height.toString(), currencyId, config);
}
