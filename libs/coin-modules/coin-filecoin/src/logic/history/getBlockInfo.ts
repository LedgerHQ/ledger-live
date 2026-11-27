import { assertBlockHeight } from "@ledgerhq/coin-module-framework/api/getBlock/assertBlockHeight";
import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { BlockNotFoundError, NoBlockAtHeightError } from "@ledgerhq/coin-module-framework/errors";
import type { FilecoinContext } from "../../config";
import { fetchBlockscoutBlock } from "../../network/blockscout";
import { fetchFinalizedHeight } from "../../network/lotus";

const MAX_CONSECUTIVE_NULL_ROUNDS = 10;

// Block data comes from Blockscout, which holds the FEVM history only (from block 2683348).
// The hash is the Ethereum-style block hash, not the CID that `lastBlock` returns.
export async function getBlockInfo(context: FilecoinContext, height: number): Promise<BlockInfo> {
  assertBlockHeight(height);
  const { indexer, node } = await context.config();
  const block = await fetchBlockAt(indexer.url, node.url, height);

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

/**
 * Blockscout has no block for a null round, and for a block it did not index yet. Only a null round
 * below the finalized tipset raises `NoBlockAtHeightError`: callers never ask for that height again
 * (ADR-083), and a reorganization can still put a tipset at a height above the finalized tipset.
 */
async function fetchBlockAt(indexerUrl: string, nodeUrl: string, height: number) {
  try {
    return await fetchBlockscoutBlock(indexerUrl, height);
  } catch (error) {
    if (
      error instanceof BlockNotFoundError &&
      (await isFinalizedNullRound(indexerUrl, nodeUrl, height))
    ) {
      throw new NoBlockAtHeightError(
        `Height ${height} is a null round`,
        { height },
        { cause: error },
      );
    }
    throw error;
  }
}

/**
 * The next tipset skips a null round: its parent is below the null round. The node only gives the
 * finalized height, because a public node does not look up tipsets older than 14 days.
 */
async function isFinalizedNullRound(
  indexerUrl: string,
  nodeUrl: string,
  height: number,
): Promise<boolean> {
  const finalizedHeight = await fetchFinalizedHeight(nodeUrl);
  if (height >= finalizedHeight) return false;

  const lastHeight = Math.min(finalizedHeight, height + MAX_CONSECUTIVE_NULL_ROUNDS + 1);
  const next = await fetchNextBlock(indexerUrl, height, lastHeight);
  if (!next) return false;

  const parent = await fetchIndexedBlock(indexerUrl, next.parent_hash);
  return parent !== undefined && parent.height < height;
}

async function fetchNextBlock(indexerUrl: string, height: number, lastHeight: number) {
  for (let nextHeight = height + 1; nextHeight <= lastHeight; nextHeight++) {
    const block = await fetchIndexedBlock(indexerUrl, nextHeight);
    if (block) return block;
  }
  return undefined;
}

async function fetchIndexedBlock(indexerUrl: string, heightOrHash: number | string) {
  try {
    return await fetchBlockscoutBlock(indexerUrl, heightOrHash);
  } catch (error) {
    if (error instanceof BlockNotFoundError) return undefined;
    throw error;
  }
}
