import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { BoilerplateCoinConfig } from "../config";
import { getLastBlock } from "../network/node";

export async function lastBlock(config: BoilerplateCoinConfig): Promise<BlockInfo> {
  const result = await getLastBlock(config);
  return {
    height: result.blockHeight,
    hash: result.blockHash,
    time: new Date(result.timestamp),
  };
}
