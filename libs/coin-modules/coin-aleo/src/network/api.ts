import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { AleoLatestBlockResponse } from "../types/api";
import { getNetworkConfig } from "../logic/utils";

async function getLatestBlock(currency: CryptoCurrency): Promise<AleoLatestBlockResponse> {
  const { nodeUrl, networkType } = getNetworkConfig(currency);

  const res = await network<AleoLatestBlockResponse>({
    method: "GET",
    url: `${nodeUrl}/v2/${networkType}/blocks/latest`,
  });

  return res.data;
}

export const apiClient = {
  getLatestBlock,
};
