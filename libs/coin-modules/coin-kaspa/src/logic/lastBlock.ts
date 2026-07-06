import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getBlockDagInfo, getVirtualChainBlueScore } from "../network";

/**
 * Latest finalized block on the Kaspa BlockDAG. The virtual chain blue score (already used as
 * `blockHeight` by the legacy bridge sync — see bridge/synchronization.ts) is the confirmed
 * selected-chain height, as opposed to `blockDagInfo.virtualDaaScore` which tracks the (unstable)
 * DAG tip. The pruning point hash is the most recent block hash guaranteed to be finalized.
 */
export async function lastBlock(): Promise<BlockInfo> {
  const [height, blockDagInfo] = await Promise.all([
    getVirtualChainBlueScore(),
    getBlockDagInfo(),
  ]);

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`kaspa: lastBlock: invalid blue score from API: ${height}`);
  }

  const hash = blockDagInfo.pruningPointHash ?? "";

  return {
    height,
    hash,
    time: new Date(),
  };
}
