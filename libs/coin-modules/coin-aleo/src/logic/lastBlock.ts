import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { AleoCoinConfig } from "../types";
import { apiClient } from "../network/api";

export async function lastBlock(config: AleoCoinConfig): Promise<BlockInfo> {
  const lastBlock = await apiClient.getLatestBlock(config);

  return {
    height: lastBlock.header.metadata.height,
    hash: lastBlock.block_hash,
    time: new Date(lastBlock.header.metadata.timestamp * 1000),
  };
}
