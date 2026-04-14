import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { AleoCoinConfig } from "../types";
import { apiClient } from "../network/api";

export async function lastBlock(configOrCurrencyId: AleoCoinConfig | string): Promise<BlockInfo> {
  const lastBlock = await apiClient.getLatestBlock(configOrCurrencyId);

  return {
    height: lastBlock.header.metadata.height,
    hash: lastBlock.block_hash,
    time: new Date(lastBlock.header.metadata.timestamp * 1000),
  };
}
