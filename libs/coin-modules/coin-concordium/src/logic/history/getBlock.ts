import type { Block } from "@ledgerhq/coin-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getBlockByHeight } from "../../network/grpcClient";

export async function getBlock(height: number, currency: CryptoCurrency): Promise<Block> {
  return getBlockByHeight(currency, height);
}
