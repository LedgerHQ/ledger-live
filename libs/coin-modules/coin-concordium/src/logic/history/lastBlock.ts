import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { getLastBlock } from "../../network/grpcClient";

export async function lastBlock(currencyId: string): Promise<BlockInfo> {
  return getLastBlock(currencyId);
}
