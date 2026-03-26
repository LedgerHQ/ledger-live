import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { tzkt } from "../network";

/**
 * Returns lightweight metadata for a Tezos block at the given level.
 *
 * Fetches the block and its predecessor in parallel so that `BlockInfo.parent`
 * is always populated without adding serial latency.
 */
export async function getBlockInfo(height: number): Promise<BlockInfo> {
  if (!Number.isSafeInteger(height) || height <= 0) {
    throw new Error(`getBlockInfo: height must be a positive integer, got ${height}`);
  }

  const [block, parentBlock] = await Promise.all([
    tzkt.getBlockByLevel(height),
    tzkt.getBlockByLevel(height - 1),
  ]);

  return {
    height: block.level,
    hash: block.hash,
    time: new Date(block.timestamp),
    parent: { height: parentBlock.level, hash: parentBlock.hash },
  };
}
