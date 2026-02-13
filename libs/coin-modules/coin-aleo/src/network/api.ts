import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { AleoLatestBlockResponse } from "../types/api";
import { getNetworkConfig } from "../logic/utils";
import { PROGRAM_ID } from "../constants";

async function getLatestBlock(currency: CryptoCurrency): Promise<AleoLatestBlockResponse> {
  const { nodeUrl, networkType } = getNetworkConfig(currency);

  const res = await network<AleoLatestBlockResponse>({
    method: "GET",
    url: `${nodeUrl}/v2/${networkType}/blocks/latest`,
  });

  return res.data;
}

async function getAccountBalance(
  currency: CryptoCurrency,
  address: string,
): Promise<string | null> {
  const { nodeUrl } = getNetworkConfig(currency);

  const res = await network<string | null>({
    method: "GET",
    url: `${nodeUrl}/programs/program/${PROGRAM_ID.CREDITS}/mapping/account/${address}`,
  });

  return res.data;
}

export const apiClient = {
  getAccountBalance,
  getLatestBlock,
};
