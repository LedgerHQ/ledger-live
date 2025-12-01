import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNodeApi } from "../network/node";

export async function getBlockInfo(currency: CryptoCurrency, height: number): Promise<BlockInfo> {
  const api = getNodeApi(currency);
  const result = await api.getBlockByHeight(currency, height);

  return {
    height: result.height,
    hash: result.hash,
    time: new Date(result.timestamp),
  };
}
