import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNodeApi } from "../network/node";

export async function lastBlock(currency: CryptoCurrency): Promise<BlockInfo> {
  const api = getNodeApi(currency);
  const result = await api.getBlockByHeight(currency, "latest");

  return {
    height: result.height,
    hash: result.hash,
    time: new Date(result.timestamp),
  };
}
