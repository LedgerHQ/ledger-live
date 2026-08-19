import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { type PolkadotCoinConfig } from "../config";
import api from "../network";

export async function lastBlock(config: PolkadotCoinConfig): Promise<BlockInfo> {
  const result = await api.getLastBlock(config);

  return {
    height: result.height,
    hash: result.hash,
    time: result.time,
  };
}
