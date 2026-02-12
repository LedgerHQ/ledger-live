import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getLastBlock } from "../../network/grpcClient";

export async function lastBlock(currency: CryptoCurrency): Promise<BlockInfo> {
  return getLastBlock(currency);
}
