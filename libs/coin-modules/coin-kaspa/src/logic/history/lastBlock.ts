import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getBlockDagInfo, getVirtualChainBlueScore } from "../../network";

/**
 * Latest block of the Kaspa selected chain, from two cheap info endpoints (no per-block lookup):
 * - `height` is the virtual-chain blue score, the same scale as the `accepting_block_blue_score`
 *   that `listOperations` reports as a transaction's height (and the legacy bridge's `blockHeight`).
 *   It is not `virtualDaaScore`, a different counter that also counts blocks off the selected chain.
 * - `hash` is the `sink` (the virtual selected parent), i.e. the chain tip. It comes from a separate
 *   call than `height`, so the two can be a block apart.
 * - `time` is approximated as `now`: Kaspa produces several blocks per second, so the tip is at most
 *   a block interval old.
 *
 * The tip block itself is not fetched: the indexer only serves `/blocks/{hash}` 10–15 s after a block
 * becomes the tip (HTTP 404 until then), which would make `lastBlock` fail most of the time.
 */
export async function lastBlock(): Promise<BlockInfo> {
  const [height, blockDagInfo] = await Promise.all([getVirtualChainBlueScore(), getBlockDagInfo()]);

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`kaspa: lastBlock: invalid blue score from API: ${height}`);
  }

  return {
    height,
    hash: blockDagInfo.sink ?? "",
    time: new Date(),
  };
}
