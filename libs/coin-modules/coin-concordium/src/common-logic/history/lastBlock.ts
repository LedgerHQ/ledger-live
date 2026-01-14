import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getLastBlock } from "../../network/grpcClient";

export async function lastBlock(currency: CryptoCurrency): Promise<BlockInfo> {
  const result = await getLastBlock(currency);
  return {
    height: result.blockHeight,
    hash: result.blockHash,
    time: new Date(result.timestamp),
  };
}
