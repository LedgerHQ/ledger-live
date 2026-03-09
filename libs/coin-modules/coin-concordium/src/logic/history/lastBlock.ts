import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getLastBlock } from "../../network/grpcClient";

export async function lastBlock(currencyId: string): Promise<BlockInfo> {
  return getLastBlock(currencyId);
}
