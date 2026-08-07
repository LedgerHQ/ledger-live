import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getBlocksAtHeight, getBlockInfoByHash } from "../../network/proxyClient";
import type { ConcordiumCoinConfig } from "../../types";

export async function getBlockInfo(
  height: number,
  currencyId: string,
  config?: ConcordiumCoinConfig,
): Promise<BlockInfo> {
  const blockHashes = await getBlocksAtHeight(currencyId, height, config);

  if (blockHashes.length === 0) {
    throw new Error(`No blocks found at height ${height}`);
  }

  const info = await getBlockInfoByHash(currencyId, blockHashes[0], config);
  const result: BlockInfo = {
    height: info.blockHeight,
    hash: info.blockHash,
    time: new Date(info.blockSlotTime),
  };

  if (info.blockHeight > 0 && info.blockParent) {
    const parentInfo = await getBlockInfoByHash(currencyId, info.blockParent, config);
    result.parent = {
      height: parentInfo.blockHeight,
      hash: parentInfo.blockHash,
    };
  }

  return result;
}
