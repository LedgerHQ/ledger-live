import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getBlockInfoByHeight } from "../../network/grpcClient";

export async function getBlockInfo(height: number, currency: CryptoCurrency): Promise<BlockInfo> {
  return getBlockInfoByHeight(currency, height);
}
