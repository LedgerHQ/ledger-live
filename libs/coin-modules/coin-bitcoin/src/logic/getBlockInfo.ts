import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { BitcoinContext } from "../api/config";
import { getBlockByHeight } from "../network";

/**
 * Metadata for the block at `height` (same shape as {@link lastBlock}). The Ledger explorer's
 * `block/{height}` response carries no previous-block hash, so the optional `parent` is omitted
 * rather than paying a second request for it.
 */
export async function getBlockInfo(
  context: BitcoinContext,
  currencyId: string,
  height: number,
): Promise<BlockInfo> {
  const config = await context.config(currencyId);
  const block = await getBlockByHeight(currencyId, height, config);
  if (!block) {
    throw new Error(`getBlockInfo: explorer returned no block at height ${height}`);
  }
  return { height: block.height, hash: block.hash, time: new Date(block.time) };
}
