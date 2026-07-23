import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { MultiversXNetworkApi } from "../../network/api";

/**
 * Returns the latest finalized block height and a placeholder hash
 * (the MultiversX API exposes block round, not hash, on this endpoint).
 */
export async function lastBlock(api: MultiversXNetworkApi): Promise<BlockInfo> {
  const height = await api.getBlockchainBlockHeight();
  return {
    height,
    hash: String(height),
    time: new Date(),
  };
}
