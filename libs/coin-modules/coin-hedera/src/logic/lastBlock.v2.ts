import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import BigNumber from "bignumber.js";
import { FINALITY_MS, SYNTHETIC_BLOCK_WINDOW_SECONDS } from "../constants";
import { apiClient } from "../network/api";
import { hgraphClient } from "../network/hgraph";
import { getSyntheticBlock, nanosToSeconds } from "./utils";

/**
 * Gets the latest "block" information for Hedera.
 *
 * Hedera doesn't have actual blocks - it uses a timestamp-based consensus model.
 * To make Hedera compatible with block-based architecture:
 * 1. We fetch the most recent transaction from the mirror node
 * 2. Extract its consensus timestamp
 * 3. Convert this timestamp into a synthetic block using a hardcoded time window (10 seconds by default)
 */
export async function lastBlockV2(): Promise<BlockInfo> {
  // see getBlock implementation, block data should be immutable: we do not allow querying blocks on non-finalized time range.
  // => we search the most recent transaction, but only in finalized time range (ending 10 seconds ago).
  const before = new Date(Date.now() - FINALITY_MS - SYNTHETIC_BLOCK_WINDOW_SECONDS * 1000);
  const [latestTransaction, latestHgraphTimestampNs] = await Promise.all([
    apiClient.getLatestTransaction(before),
    hgraphClient.getLatestIndexedConsensusTimestamp(),
  ]);

  // take the smaller of the two timestamps (mirror node vs hgraph) to ensure we only return blocks for which we have all data available
  const lastMirrorTimestamp = latestTransaction.consensus_timestamp;
  const lastHgraphTimestamp = nanosToSeconds(latestHgraphTimestampNs);
  const consensusTimestamp = BigNumber.minimum(lastMirrorTimestamp, lastHgraphTimestamp).toFixed(9);

  const syntheticBlock = getSyntheticBlock(consensusTimestamp);

  return {
    height: syntheticBlock.blockHeight,
    hash: syntheticBlock.blockHash,
    time: syntheticBlock.blockTime,
  };
}
