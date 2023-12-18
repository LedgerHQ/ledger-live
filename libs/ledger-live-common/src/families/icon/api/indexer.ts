import { BigNumber } from "bignumber.js";
import network from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { LIMIT } from "../constants";
import { isTestnet } from "../logic";


/**
 * Returns Testnet API URL if the current currency is testnet
 *
 * @param {currency} CryptoCurrency
 */
export function getApiUrl(currency: CryptoCurrency): string {
  let apiUrl = getEnv("ICON_INDEXER_ENDPOINT");
  if (isTestnet(currency)) {
    apiUrl = getEnv("ICON_TESTNET_API_ENDPOINT");
  }
  return apiUrl;
}


export const getAccountBalance = async (addr: string, url: string): Promise<string> => {
  try {
    const resp = await network({
      method: "GET",
      url: `${url}/addresses/details/${addr.toString()}?address=${addr.toString()}`,
    });
    const { data } = resp;
    const balance = data?.balance;
    return balance;
  } catch (error) {
    return '0'
  }
};

export const getLatestBlockHeight = async (url: string): Promise<BigNumber> => {
  const resp = await network({
    method: "GET",
    url: `${url}/blocks`,
  });
  const { data } = resp;
  const blockHeight = data[0]?.number;

  return blockHeight;
};

export const getHistory = async (addr: string, skip: number, url: string) => {
  const limit = LIMIT;
  const result = await network({
    method: "GET",
    url: `${url}/transactions/address/${addr}?address=${addr}&skip=${skip}&limit=${limit}`,
  });
  const { data: respData } = result;
  if (!respData) {
    return [];
  }

  let allTransactions = [...respData];
  if (limit == allTransactions.length) {
    while (limit == allTransactions.length) {
      skip += limit;
      const { data: res } = await network({
        method: "GET",
        url: `${url}/transactions/address/${addr}?address=${addr}&skip=${skip}&limit=${limit}`,
      });

      allTransactions = [...allTransactions, ...(res || [])];
    }
  }

  return allTransactions;
};
