import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../config";
import { fetchBlock } from "../network/explorer";
import type { ExplorerBlock } from "../network/types";

/** Maps an explorer block to a {@link BlockInfo}; `parent` is set when the previous hash is known. */
export function toBlockInfo(block: ExplorerBlock): BlockInfo {
  const info: BlockInfo = { height: block.height, hash: block.hash, time: new Date(block.time) };
  if (block.prevHash && block.height > 0) {
    info.parent = { height: block.height - 1, hash: block.prevHash };
  }
  return info;
}

export async function getBlockInfo(
  context: BitcoinContext,
  currencyId: string,
  height: number,
): Promise<BlockInfo> {
  const config = await context.config(currencyId);
  return toBlockInfo(await fetchBlock(config, currencyId, height));
}
