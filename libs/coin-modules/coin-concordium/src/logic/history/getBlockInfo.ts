import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getBlocksAtHeight, getBlockInfoByHash } from "../../network/proxyClient";
import type { ConcordiumContext } from "../../types";

export async function getBlockInfo(context: ConcordiumContext, height: number): Promise<BlockInfo> {
  const blockHashes = await getBlocksAtHeight(context, height);

  if (blockHashes.length === 0) {
    throw new Error(`No blocks found at height ${height}`);
  }

  const info = await getBlockInfoByHash(context, blockHashes[0]);
  const result: BlockInfo = {
    height: info.blockHeight,
    hash: info.blockHash,
    time: new Date(info.blockSlotTime),
  };

  if (info.blockHeight > 0 && info.blockParent) {
    const parentInfo = await getBlockInfoByHash(context, info.blockParent);
    result.parent = {
      height: parentInfo.blockHeight,
      hash: parentInfo.blockHash,
    };
  }

  return result;
}
