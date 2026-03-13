import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { tzkt } from "../network";

/**
 * Returns lightweight metadata for a Tezos block at the given level.
 *
 * Mirrors the XRP `getBlockInfo` contract:
 * - Returns an empty sentinel value for height <= 0 (avoids a network call).
 * - Does NOT populate `BlockInfo.parent` because TzKT does not include the
 *   predecessor hash in its default block response.  The field is optional in
 *   the coin-framework type so callers must handle its absence.
 */
export async function getBlockInfo(height: number): Promise<BlockInfo> {
  if (height <= 0) {
    return { height, hash: "", time: new Date(0) };
  }

  const block = await tzkt.getBlockByLevel(height);

  return {
    height: block.level,
    hash: block.hash,
    time: new Date(block.timestamp),
  };
}
