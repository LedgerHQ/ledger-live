import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { fetchLastBlock } from "../network/api";

export async function lastBlock(): Promise<BlockInfo> {
  return fetchLastBlock();
}
