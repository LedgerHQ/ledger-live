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

  if (height > 0 && result.parentHash && !/^0x0+$/.test(result.parentHash)) {
    blockInfo.parent = {
      height: result.height - 1,
      hash: result.parentHash,
    };
  }

  return blockInfo;
}
