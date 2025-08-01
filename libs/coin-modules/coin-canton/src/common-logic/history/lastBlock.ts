import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { getLastBlock } from "../../network/node";

export async function lastBlock(): Promise<BlockInfo> {
  const result = await getLastBlock();
  return {
    height: result.blockHeight,
    hash: result.blockHash,
    time: new Date(result.timestamp),
  };
}
