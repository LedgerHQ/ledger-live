import { delay } from "@ledgerhq/live-promise";
import { Operation } from "@ledgerhq/types-live";
import axios, { AxiosRequestConfig } from "axios";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";
import { EtherscanAPIError } from "../errors";
import {
  etherscanOperationToOperation,
  etherscanERC20EventToOperation,
  etherscanERC721EventToOperation,
  etherscanERC1155EventToOperation,
} from "../adapters";
import {
  EtherscanERC1155Event,
  EtherscanERC20Event,
  EtherscanERC721Event,
  EtherscanOperation,
} from "../types";

export const ETHERSCAN_TIMEOUT = 5000; // 5 seconds between 2 calls
export const DEFAULT_RETRIES_API = 8;

async function fetchWithRetries<T>(
  params: AxiosRequestConfig,
  retries = DEFAULT_RETRIES_API,
): Promise<T> {
  try {
    const { data } = await axios.request<{
      status: string;
      message: string;
      result: T;
    }>(params);

    if (!Number(data.status) && data.message === "NOTOK") {
      throw new EtherscanAPIError("Error while fetching data from Etherscan like API", {
        params,
        data,
      });
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
 * Get all the last "normal" transactions (no tokens / NFTs)
 */
export const getLastCoinOperations = makeLRUCache<
  [currency: CryptoCurrency, address: string, accountId: string, fromBlock: number],
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
      .map(tx => etherscanOperationToOperation(accountId, tx))
      .filter(Boolean) as Operation[];
  },
  (currency, address, accountId, fromBlock) => accountId + fromBlock,
  { ttl: 5 * 1000 },
);

/**
 * Get all the last ERC20 transactions
 */
export const getLastTokenOperations = makeLRUCache<
  [currency: CryptoCurrency, address: string, accountId: string, fromBlock: number],
  Operation[]
>(
  async (currency, address, accountId, fromBlock) => {
    const apiDomain = currency.ethereumLikeInfo?.explorer?.uri;
    if (!apiDomain) {
      return [];
    }

    let url = `${apiDomain}/api?module=account&action=tokentx&address=${address}&tag=latest&page=1&sort=desc`;
    if (fromBlock) {
      url += `&startBlock=${fromBlock}`;
    }

    const ops = await fetchWithRetries<EtherscanERC20Event[]>({
      method: "GET",
      url,
    });

    return ops
      .map((event, index) => etherscanERC20EventToOperation(accountId, event, index))
      .filter(Boolean) as Operation[];
  },
  (currency, address, accountId, fromBlock) => accountId + fromBlock,
  { ttl: 5 * 1000 },
);

/**
 * Get all the last ERC721 transactions
 */
export const getLastERC721Operations = makeLRUCache<
  [currency: CryptoCurrency, address: string, accountId: string, fromBlock: number],
  Operation[]
>(
  async (currency, address, accountId, fromBlock) => {
    const apiDomain = currency.ethereumLikeInfo?.explorer?.uri;
    if (!apiDomain) {
      return [];
    }

    let url = `${apiDomain}/api?module=account&action=tokennfttx&address=${address}&tag=latest&page=1&sort=desc`;
    if (fromBlock) {
      url += `&startBlock=${fromBlock}`;
    }

    const ops = await fetchWithRetries<EtherscanERC721Event[]>({
      method: "GET",
      url,
    });

    // Why this thing ?
    // Multiple events can be fired by the same transactions and
    // those transfer events can go from anyone to anyone, which
    // means that multiple events could be sent to or from the
    // same address during the same transaction.
    //
    // To make sure every event (transformed into an operation here)
    // has a unique id, we're groupping them by transaction hash
    // and using the index for each event fired.
    const opsByHash: Record<string, EtherscanERC721Event[]> = {};
    for (const op of ops) {
      if (!opsByHash[op.hash]) {
        opsByHash[op.hash] = [];
      }
      opsByHash[op.hash].push(op);
    }

    return Object.values(opsByHash)
      .map(events =>
        events.map((event, index) => etherscanERC721EventToOperation(accountId, event, index)),
      )
      .flat();
  },
  (currency, address, accountId, fromBlock) => accountId + fromBlock,
  { ttl: 5 * 1000 },
);

/**
 * Get all the last ERC71155 transactions
 */
export const getLastERC1155Operations = makeLRUCache<
  [currency: CryptoCurrency, address: string, accountId: string, fromBlock: number],
  Operation[]
>(
  async (currency, address, accountId, fromBlock) => {
    const apiDomain = currency.ethereumLikeInfo?.explorer?.uri;
    if (!apiDomain) {
      return [];
    }

    let url = `${apiDomain}/api?module=account&action=token1155tx&address=${address}&tag=latest&page=1&sort=desc`;
    if (fromBlock) {
      url += `&startBlock=${fromBlock}`;
    }

    const ops = await fetchWithRetries<EtherscanERC1155Event[]>({
      method: "GET",
      url,
    });

    // Why this thing ?
    // Multiple events can be fired by the same transactions and
    // those transfer events can go from anyone to anyone, which
    // means that multiple events could be sent to or from the
    // same address during the same transaction.
    //
    // To make sure every event (transformed into an operation here)
    // has a unique id, we're groupping them by transaction hash
    // and using the index for each event fired.
    const opsByHash: Record<string, EtherscanERC1155Event[]> = {};
    for (const op of ops) {
      if (!opsByHash[op.hash]) {
        opsByHash[op.hash] = [];
      }
      opsByHash[op.hash].push(op);
    }

    return Object.values(opsByHash)
      .map(events =>
        events.map((event, index) => etherscanERC1155EventToOperation(accountId, event, index)),
      )
      .flat();
  },
  (currency, address, accountId, fromBlock) => accountId + fromBlock,
  { ttl: 5 * 1000 },
);

/**
 * Get all NFT related operations (ERC721 + ERC1155)
 */
export const getLastNftOperations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
): Promise<Operation[]> => {
  const erc721Ops = await getLastERC721Operations(currency, address, accountId, fromBlock);
  const erc1155Ops = await getLastERC1155Operations(currency, address, accountId, fromBlock);

  return [...erc721Ops, ...erc1155Ops].sort(
    // sorting DESC order
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
};

/**
 * Wrapper around all operation types' requests
 *
 * ⚠ The lack of parallelization is on purpose,
 * do not use a Promise.all here, it would
 * break because of the rate limits
 */
export const getLastOperations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
): Promise<{
  lastCoinOperations: Operation[];
  lastTokenOperations: Operation[];
  lastNftOperations: Operation[];
}> => {
  const lastCoinOperations = await getLastCoinOperations(currency, address, accountId, fromBlock);

  const lastTokenOperations = await getLastTokenOperations(currency, address, accountId, fromBlock);

  const lastNftOperations = isNFTActive(currency)
    ? await getLastNftOperations(currency, address, accountId, fromBlock)
    : [];

  return {
    lastCoinOperations,
    lastTokenOperations,
    lastNftOperations,
  };
};

export default {
  getLastCoinOperations,
  getLastTokenOperations,
  getLastERC721Operations,
  getLastERC1155Operations,
  getLastNftOperations,
  getLastOperations,
};
