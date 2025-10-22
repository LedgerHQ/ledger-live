import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { apiClient } from "../network/api";
import { getSyntheticBlock } from "./utils";

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
  const latestTransaction = await apiClient.getLatestTransaction();
  const syntheticBlock = getSyntheticBlock(latestTransaction.consensus_timestamp);

  return {
    height: syntheticBlock.blockHeight,
    hash: syntheticBlock.blockHash,
    time: syntheticBlock.blockTime,
  };
}
