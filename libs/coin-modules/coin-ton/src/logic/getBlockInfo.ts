import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { BlockNotFoundError } from "@ledgerhq/coin-module-framework/errors";
import type { TonContext } from "../config";
import { fetchMasterchainBlock } from "../network";
import type { TonMasterchainBlock } from "../network/types";

export const toBlockInfo = (block: TonMasterchainBlock): BlockInfo => ({
  height: block.seqno,
  hash: block.root_hash,
  time: new Date(Number(block.gen_utime) * 1000),
});

export async function getBlockInfo(context: TonContext, height: number): Promise<BlockInfo> {
  const block = await fetchMasterchainBlock(await context.config(), height);
  if (!block) throw new BlockNotFoundError(`TON masterchain block ${height} not found`);
  return toBlockInfo(block);
}
