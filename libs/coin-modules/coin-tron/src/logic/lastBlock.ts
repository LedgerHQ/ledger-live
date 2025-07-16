import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { getLastBlock } from "../network";

export async function lastBlock(): Promise<BlockInfo> {
  return await getLastBlock();
}
