import { Operation } from "@ledgerhq/types-live";
import axios, { AxiosRequestConfig } from "axios";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { etherscanOperationToOperation } from "../adapters";
import { EtherscanOperation } from "../types";
import { makeLRUCache } from "../../../cache";
import { EtherscanAPIError } from "../errors";
import { delay } from "../../../promise";

export const DEFAULT_RETRIES_API = 5;
export const ETHERSCAN_TIMEOUT = 5000; // 5 seconds between 2 calls

async function fetchWithRetries<T>(
  params: AxiosRequestConfig,
  retries = DEFAULT_RETRIES_API
): Promise<T> {
  try {
    const { data } = await axios.request<{
      status: string;
      message: string;
      result: T;
    }>(params);

    if (!Number(data.status) && data.message === "NOTOK") {
      throw new EtherscanAPIError(
        "Error while fetching data from Etherscan like API",
        { params, data }
      );
    }

    return data.result;
  } catch (e) {
    if (retries) {
      // wait the API timeout before trying again
      await delay(ETHERSCAN_TIMEOUT);
      // decrement with prefix here or it won't work
      return fetchWithRetries<T>(params, --retries);
    }
    throw e;
  }
}

/**
 * Get all the latest "normal" transactions (no tokens / NFTs)
 */
export const getLatestTransactions = makeLRUCache<
  [
    currency: CryptoCurrency,
    address: string,
    accountId: string,
    fromBlock: number
  ],
  Operation[]
>(
  async (currency, address, accountId, fromBlock) => {
    const apiDomain = currency.ethereumLikeInfo?.explorer?.uri;
    if (!apiDomain) {
      return [];
    }

    let url = `${apiDomain}/api?module=account&action=txlist&address=${address}&tag=latest&page=1&sort=desc`;
    if (fromBlock) {
      url += `&startBlock=${fromBlock}`;
    }

    const ops = await fetchWithRetries<EtherscanOperation[]>({
      method: "GET",
      url,
    });

    return ops
      .map((tx) => etherscanOperationToOperation(accountId, address, tx))
      .filter(Boolean) as Operation[];
  },
  (currency, address, accountId) => accountId,
  { maxAge: 6 * 1000 }
);

export default {
  getLatestTransactions,
};
