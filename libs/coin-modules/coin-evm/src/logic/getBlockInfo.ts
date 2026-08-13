import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { EvmContext } from "../config";
import { getNodeApi } from "../network/node";

export async function getBlockInfo(
  context: EvmContext,
  currencyId: string,
  height: number,
): Promise<BlockInfo> {
  const config = await context.config(currencyId);
  const api = getNodeApi(config, currencyId);
  const result = await api.getBlockByHeight(currencyId, height);

  const blockInfo: BlockInfo = {
    height: result.height,
    hash: result.hash,
    time: new Date(result.timestamp),
  };

  if (height > 0 && result.parentHash && !/^0x0+$/.test(result.parentHash)) {
    blockInfo.parent = {
      height: result.height - 1,
      hash: result.parentHash,
    };
  }

  return blockInfo;
}
