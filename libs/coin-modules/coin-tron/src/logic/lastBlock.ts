import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { TronCoinConfig } from "../config";
import { getLastBlock } from "../network";

export async function lastBlock(logger: Logger, config: TronCoinConfig): Promise<BlockInfo> {
  const block = await getLastBlock(logger, config);
  return {
    height: block.height,
    hash: block.hash,
    time: block.time ?? new Date(0),
  };
}
