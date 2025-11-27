import type { Block, BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNodeApi } from "../network/node";

export async function getBlock(currency: CryptoCurrency, height: number): Promise<Block> {
  const api = getNodeApi(currency);
  const result = await api.getBlockByHeight(currency, height);

  const info: BlockInfo = {
    height: result.height,
    hash: result.hash,
    time: new Date(result.timestamp),
  };

  return {
    info,
    transactions: [],
  };
}
