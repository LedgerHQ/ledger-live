import type { Block } from "@ledgerhq/coin-framework/api/index";
import { getBlockByHeight } from "../../network/grpcClient";

export async function getBlock(height: number, currencyId: string): Promise<Block> {
  return getBlockByHeight(currencyId, height);
}
