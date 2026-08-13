import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { fetchBlockByHeight } from "../../network/blocks";
import type { BlockResponse } from "../../types/api";

export function toBlockInfo(block: BlockResponse): BlockInfo {
  return {
    height: block.height,
    hash: block.hash,
    time: new Date(block.burn_block_time * 1000),
  };
}

/** Block metadata (height/hash/time) at a given height. Guards against a negative height so a
 * literal-decrement caller upstream can't underflow past genesis on regtest/devnet (height 0). */
export async function getBlockInfo(height: number): Promise<BlockInfo> {
  if (height < 0) {
    throw new Error("stacks: block height must be >= 0");
  }

  const block = await fetchBlockByHeight(height);
  return toBlockInfo(block);
}
