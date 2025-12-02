import { BlockInfo } from "@ledgerhq/coin-framework/lib/api/types";
import { getLastBlockInfo } from "../network/sdk";

export async function lastBlock(): Promise<BlockInfo> {
  return await getLastBlockInfo();
}
