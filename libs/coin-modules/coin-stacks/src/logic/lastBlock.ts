import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { fetchLatestBlock } from "../network/blocks";
import { getBlockInfo, toBlockInfo } from "./getBlockInfo";

/** Falls back to the chain tip's previous block: the indexer exposes no "finalized"/"pending"
 * flag (only `canonical: boolean`), and with ~5s block times the tip is effectively never
 * finalized, so the fallback is unconditional rather than a real if/else. */
export async function lastBlock(): Promise<BlockInfo> {
  const tip = await fetchLatestBlock();
  if (tip.height <= 0) {
    return toBlockInfo(tip);
  }
  return getBlockInfo(tip.height - 1);
}
