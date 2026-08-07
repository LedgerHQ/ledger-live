import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { TronCoinConfig } from "../config";
import { getLastBlock } from "../network";

export async function lastBlock(config?: TronCoinConfig): Promise<BlockInfo> {
  const block = await getLastBlock(config);
  return {
    height: block.height,
    hash: block.hash,
    time: block.time ?? new Date(0),
  };
}
