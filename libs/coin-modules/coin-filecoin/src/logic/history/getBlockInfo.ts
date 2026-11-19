import { assertBlockHeight } from "@ledgerhq/coin-module-framework/api/getBlock/assertBlockHeight";
import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { BlockNotFoundError } from "@ledgerhq/coin-module-framework/errors";
import type { FilecoinContext } from "../../config";
import { fetchBlockscoutBlock } from "../../network/blockscout";

// Block data comes from Blockscout, which holds the FEVM history only (from block 2683348).
// The hash is the Ethereum-style block hash, not the CID that `lastBlock` returns.
export async function getBlockInfo(context: FilecoinContext, height: number): Promise<BlockInfo> {
  assertBlockHeight(height);
  const { indexer } = await context.config();
  const block = await fetchBlockscoutBlock(indexer.url, height);

  const info: BlockInfo = {
    height: block.height,
    hash: block.hash,
    time: new Date(block.timestamp),
  };

  // Null rounds leave gaps in the heights, so the parent's height is read from the parent block
  // rather than assumed to be `height - 1`. The first indexed block has no indexed parent.
  try {
    const parent = await fetchBlockscoutBlock(indexer.url, block.parent_hash);
    info.parent = { height: parent.height, hash: parent.hash };
  } catch (error) {
    if (!(error instanceof BlockNotFoundError)) throw error;
  }

  return info;
}
