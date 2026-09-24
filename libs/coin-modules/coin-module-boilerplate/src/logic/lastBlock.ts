import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getLastBlock } from "../network/node";
import type { BoilerplateCoinConfig } from "../config";

export async function lastBlock(config: BoilerplateCoinConfig): Promise<BlockInfo> {
  const result = await getLastBlock(config);
  return {
    height: result.blockHeight,
    hash: result.blockHash,
    time: new Date(result.timestamp),
  };
}
