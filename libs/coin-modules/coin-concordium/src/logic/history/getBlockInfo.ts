import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { getBlockInfoByHeight } from "../../network/grpcClient";

export async function getBlockInfo(height: number, currencyId: string): Promise<BlockInfo> {
  return getBlockInfoByHeight(currencyId, height);
}
