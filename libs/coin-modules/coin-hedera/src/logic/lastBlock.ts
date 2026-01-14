import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { apiClient } from "../network/api";
import { getSyntheticBlock } from "./utils";
import { FINALITY_MS } from "../constants";

/**
 * Gets the latest "block" information for Hedera.
 *
 * Hedera doesn't have actual blocks - it uses a timestamp-based consensus model.
 * To make Hedera compatible with block-based architecture:
 * 1. We fetch the most recent transaction from the mirror node
 * 2. Extract its consensus timestamp
 * 3. Convert this timestamp into a synthetic block using a hardcoded time window (10 seconds by default)
 */
export async function lastBlock(): Promise<BlockInfo> {
  // see getBlock implementation, block data should be immutable: we do not allow querying blocks on non-finalized time range
  // => we search the most recent transaction, but only in finalized time range (ending 10 seconds ago).
  const before = new Date(Date.now() - FINALITY_MS);
  const latestTransaction = await apiClient.getLatestTransaction(before);
  const syntheticBlock = getSyntheticBlock(latestTransaction.consensus_timestamp);

  return {
    height: syntheticBlock.blockHeight,
    hash: syntheticBlock.blockHash,
    time: syntheticBlock.blockTime,
  };
}
