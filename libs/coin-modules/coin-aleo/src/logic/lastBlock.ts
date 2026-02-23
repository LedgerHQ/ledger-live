import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { apiClient } from "../network/api";

export async function lastBlock(currency: CryptoCurrency): Promise<BlockInfo> {
  const lastBlock = await apiClient.getLatestBlock(currency);

  return {
    height: lastBlock.header.metadata.height,
    hash: lastBlock.block_hash,
    time: new Date(lastBlock.header.metadata.timestamp * 1000),
  };
}
