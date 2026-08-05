import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getBlock as getBlockFromNetwork } from "../../network";
import type { ApiResponseBlock } from "../../types";

// Map a Thor block to BlockInfo (id/number/timestamp are present regardless of `expanded`).
export function toBlockInfo(block: ApiResponseBlock): BlockInfo {
  return {
    height: block.number,
    hash: block.id,
    // Thor block timestamps are unix seconds.
    time: new Date(block.timestamp * 1000),
  };
}

/** Block metadata (height/hash/time) at a given block height, via Thor `GET /blocks/{height}`. */
export async function getBlockInfo(height: number): Promise<BlockInfo> {
  const block = await getBlockFromNetwork(height);

  if (!block) {
    throw new Error(`vechain: no block at height ${height}`);
  }

  return toBlockInfo(block);
}
