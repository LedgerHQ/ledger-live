import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getBlockDagInfo, getVirtualChainBlueScore } from "../../network";

/**
 * Latest block of the Kaspa selected chain, from two cheap info endpoints (no per-block lookup).
 * Both describe the `sink` (the virtual selected parent), i.e. the chain tip:
 * - `height` is the sink's blue score (`/info/virtual-chain-blue-score` serves the node's
 *   `getSinkBlueScore`), the same scale as the `accepting_block_blue_score` that `listOperations`
 *   reports as a transaction's height. It is not `virtualDaaScore`, a different counter.
 * - `hash` is the sink hash from `/info/blockdag`.
 * - `time` is approximated as `now`: Kaspa produces about 10 blocks per second, so the tip is at most
 *   a block interval old.
 *
 * The two calls are separate snapshots of a tip that moves about 10 times per second, so `height` and
 * `hash` are not guaranteed to identify the same block: `height` can be a few to a few tens of blue
 * score units off the blue score of the block named by `hash`, in either direction. Callers must not
 * expect `getBlockInfo(height).hash` to equal `hash`.
 *
 * The tip block itself is not fetched: the indexer only serves `/blocks/{hash}` 10–15 s after a block
 * becomes the tip (HTTP 404 until then), which would make `lastBlock` fail most of the time.
 */
export async function lastBlock(): Promise<BlockInfo> {
  const [height, blockDagInfo] = await Promise.all([getVirtualChainBlueScore(), getBlockDagInfo()]);

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`kaspa: lastBlock: invalid blue score from API: ${height}`);
  }

  const hash = blockDagInfo.sink;
  if (typeof hash !== "string" || hash.length === 0) {
    throw new Error(`kaspa: lastBlock: missing sink hash from API: ${String(hash)}`);
  }

  return {
    height,
    hash,
    time: new Date(),
  };
}
