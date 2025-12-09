import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNodeApi } from "../network/node";

export async function getBlockInfo(currency: CryptoCurrency, height: number): Promise<BlockInfo> {
  const api = getNodeApi(currency);
  const result = await api.getBlockByHeight(currency, height);

  const blockInfo: BlockInfo = {
    height: result.height,
    hash: result.hash,
    time: new Date(result.timestamp),
  };

  if (height > 0) {
    const parentResult = await api.getBlockByHeight(currency, height - 1);
    blockInfo.parent = {
      height: parentResult.height,
      hash: parentResult.hash,
      time: new Date(parentResult.timestamp),
    };
  }

  return blockInfo;
}
