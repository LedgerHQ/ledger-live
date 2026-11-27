import { assertBlockHeight } from "@ledgerhq/coin-module-framework/api/getBlock/assertBlockHeight";
import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { BlockNotFoundError, NoBlockAtHeightError } from "@ledgerhq/coin-module-framework/errors";
import type { FilecoinContext } from "../../config";
import { fetchBlockscoutBlock, fetchBlockscoutHeadHeight } from "../../network/blockscout";

/**
 * Depth below the head at which a null round cannot change: the Expected Consensus finality, 900
 * epochs (about 7.5 h). It holds without F3, which has certified no tipset since March 2026.
 *
 * A null round has no transaction, so the delay does not reach the end user. Until a null round is
 * this deep, A4 retries it about once a minute and logs each retry as a failure: about 10,000 retries
 * a day for 24 null rounds. If that is too noisy, 60 epochs (about 30 min) divides the retries by 15.
 * It is 2 to 3 times the depth that Lotus reports as finalized without F3 (20 to 30 epochs), but a
 * deeper reorganization, while very unlikely, would put a tipset at a height that A4 skipped.
 */
const NULL_ROUND_FINALITY_DEPTH = 900;

const MAX_CONSECUTIVE_NULL_ROUNDS = 10;

// Block data comes from Blockscout, which holds the FEVM history only (from block 2683348).
// The hash is the Ethereum-style block hash, not the CID that `lastBlock` returns.
export async function getBlockInfo(context: FilecoinContext, height: number): Promise<BlockInfo> {
  assertBlockHeight(height);
  const { indexer } = await context.config();
  const block = await fetchBlockAt(indexer.url, height);

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
 * Blockscout has no block for a null round, and for a block it did not index yet. Only a final null
 * round raises `NoBlockAtHeightError`: callers never ask for that height again (ADR-083).
 */
async function fetchBlockAt(indexerUrl: string, height: number) {
  try {
    return await fetchBlockscoutBlock(indexerUrl, height);
  } catch (error) {
    if (error instanceof BlockNotFoundError && (await isFinalNullRound(indexerUrl, height))) {
      throw new NoBlockAtHeightError(
        `Height ${height} is a null round`,
        { height },
        { cause: error },
      );
    }
    throw error;
  }
}

/** The height is final, and the next tipset skips it: its parent is below the height. */
async function isFinalNullRound(indexerUrl: string, height: number): Promise<boolean> {
  const headHeight = await fetchBlockscoutHeadHeight(indexerUrl);
  if (height > headHeight - NULL_ROUND_FINALITY_DEPTH) return false;

  const next = await fetchNextBlock(indexerUrl, height, height + MAX_CONSECUTIVE_NULL_ROUNDS + 1);
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
