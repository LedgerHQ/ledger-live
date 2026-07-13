import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getBlockDagInfo, getVirtualChainBlueScore } from "../network";

/**
 * Latest confirmed block on the Kaspa BlockDAG. `height` is the virtual-chain blue score — the
 * confirmed selected-chain height (already used as `blockHeight` by the legacy bridge sync, see
 * bridge/synchronization.ts), as opposed to `virtualDaaScore` which tracks the unstable DAG tip.
 *
 * Kept cheap and self-contained (no per-block lookup), mirroring the UTXO reference coin-cardano's
 * `lastBlock`:
 * - `time` is approximated as `now`. Kaspa produces blocks ~every second, so the tip was minted
 *   within the last block interval — a fine approximation *for the tip only*. Accurate per-block
 *   timestamps come from `getBlockInfo`/`getBlock`, which fetch the actual block.
 * - `hash` uses the pruning-point hash (the most recent guaranteed-finalized block). We do NOT
 *   resolve the tip block by blue score here: that endpoint can lag behind the just-produced tip,
 *   which would make `lastBlock` throw — cardano avoids the same second lookup for this reason.
 */
export async function lastBlock(): Promise<BlockInfo> {
  const [height, blockDagInfo] = await Promise.all([getVirtualChainBlueScore(), getBlockDagInfo()]);

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`kaspa: lastBlock: invalid blue score from API: ${height}`);
  }

  return {
    height,
    hash: blockDagInfo.pruningPointHash ?? "",
    time: new Date(),
  };
}
