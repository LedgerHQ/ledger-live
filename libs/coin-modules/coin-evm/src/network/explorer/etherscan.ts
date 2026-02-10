import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { delay } from "@ledgerhq/live-promise";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import axios, { AxiosRequestConfig } from "axios";
import {
  etherscanOperationToOperations,
  etherscanERC20EventToOperations,
  etherscanERC721EventToOperations,
  etherscanERC1155EventToOperations,
  etherscanInternalTransactionToOperations,
} from "../../adapters";
import { getCoinConfig } from "../../config";
import {
  EtherscanAPIError,
  EtherscanLikeExplorerUsedIncorrectly,
  InvalidExplorerResponse,
} from "../../errors";
import {
  EtherscanERC1155Event,
  EtherscanERC20Event,
  EtherscanERC721Event,
  EtherscanInternalTransaction,
  EtherscanOperation,
} from "../../types";
import { ExplorerApi, isEtherscanLikeExplorerConfig } from "./types";

export const ETHERSCAN_TIMEOUT = 5000; // 5 seconds between 2 calls
export const DEFAULT_RETRIES_API = 8;

export async function fetchWithRetries<T>(
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
 * Get all the latest "normal" transactions (no tokens / NFTs)
 */
export const getLastCoinOperations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
): Promise<Operation[]> => {
  const config = getCoinConfig(currency).info;
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isEtherscanLikeExplorerConfig(explorer)) {
    throw new EtherscanLikeExplorerUsedIncorrectly();
  }

  const url =
    explorer.type === "corescan"
      ? `${explorer.uri}/accounts/list_of_txs_by_address/${address}`
      : `${explorer.uri}?module=account&action=txlist&address=${address}`;

  const ops = await fetchWithRetries<EtherscanOperation[]>({
    method: "GET",
    url,
    params: {
      tag: "latest",
      page: 1,
      sort: "desc",
      startBlock: fromBlock,
      endBlock: toBlock,
    },
  });

  return ops.map(tx => etherscanOperationToOperations(accountId, tx)).flat();
};

/**
 * Get all the latest ERC20 transactions
 */
export const getLastTokenOperations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
): Promise<Operation[]> => {
  const config = getCoinConfig(currency).info;
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isEtherscanLikeExplorerConfig(explorer)) {
    throw new EtherscanLikeExplorerUsedIncorrectly();
  }

  const url =
    explorer.type === "corescan"
      ? `${explorer.uri}/accounts/list_of_erc20_transfer_events_by_address/${address}`
      : `${explorer.uri}?module=account&action=tokentx&address=${address}`;

  const ops = await fetchWithRetries<EtherscanERC20Event[]>({
    method: "GET",
    url,
    params: {
      tag: "latest",
      page: 1,
      sort: "desc",
      startBlock: fromBlock,
      endBlock: toBlock,
    },
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
  const opsByHash: Record<string, EtherscanERC20Event[]> = {};
  for (const op of ops) {
    if (!opsByHash[op.hash]) {
      opsByHash[op.hash] = [];
    }
    opsByHash[op.hash].push(op);
  }

  const allOperationsArrays = Object.values(opsByHash).map(events =>
    events.map((event, index) => etherscanERC20EventToOperations(accountId, event, index)),
  );

  return allOperationsArrays.flat(2);
};

/**
 * Get all the latest ERC721 transactions
 */
export const getLastERC721Operations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
): Promise<Operation[]> => {
  const config = getCoinConfig(currency).info;
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isEtherscanLikeExplorerConfig(explorer)) {
    throw new EtherscanLikeExplorerUsedIncorrectly();
  }

  const url =
    explorer.type === "corescan"
      ? `${explorer.uri}/accounts/list_of_erc721_transfer_events_by_address/${address}`
      : `${explorer.uri}?module=account&action=tokennfttx&address=${address}`;

  const ops = await fetchWithRetries<EtherscanERC721Event[]>({
    method: "GET",
    url,
    params: {
      tag: "latest",
      page: 1,
      sort: "desc",
      startBlock: fromBlock,
      endBlock: toBlock,
    },
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
      events.map((event, index) => etherscanERC721EventToOperations(accountId, event, index)),
    )
    .flat(2);
};

/**
 * Get all the latest ERC1155 transactions
 */
export const getLastERC1155Operations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
): Promise<Operation[]> => {
  const config = getCoinConfig(currency).info;
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isEtherscanLikeExplorerConfig(explorer)) {
    throw new EtherscanLikeExplorerUsedIncorrectly();
  }

  // Blockscout and Corescan have no ERC1155 support yet
  if (["blockscout", "corescan"].includes(explorer.type)) {
    return [];
  }

  const ops = await fetchWithRetries<EtherscanERC1155Event[]>({
    method: "GET",
    url: `${explorer.uri}?module=account&action=token1155tx&address=${address}`,
    params: {
      tag: "latest",
      page: 1,
      sort: "desc",
      startBlock: fromBlock,
      endBlock: toBlock,
    },
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
      events.map((event, index) => etherscanERC1155EventToOperations(accountId, event, index)),
    )
    .flat(2);
};

/**
 * Get all NFT related operations (ERC721 + ERC1155)
 */
export const getLastNftOperations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
): Promise<Operation[]> => {
  const config = getCoinConfig(currency).info;
  if (!config.showNfts) {
    return [];
  }

  const erc721Ops = await getLastERC721Operations(currency, address, accountId, fromBlock, toBlock);
  const erc1155Ops = await getLastERC1155Operations(
    currency,
    address,
    accountId,
    fromBlock,
    toBlock,
  );

  return [...erc721Ops, ...erc1155Ops].sort(
    // sorting DESC order
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
};

// blockscout returns tx hash in transactionHash field
const fixTxHash = (op: EtherscanInternalTransaction): EtherscanInternalTransaction => ({
  ...op,
  hash: op.hash ?? op.transactionHash,
});

/**
 * Get all the latest internal transactions
 */
export const getLastInternalOperations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
): Promise<Operation[]> => {
  const config = getCoinConfig(currency).info;
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isEtherscanLikeExplorerConfig(explorer)) {
    throw new EtherscanLikeExplorerUsedIncorrectly();
  }

  // Corescan has no support to get internal operations by address
  if (explorer.type === "corescan") return [];

  const ops = await fetchWithRetries<EtherscanInternalTransaction[]>({
    method: "GET",
    url: `${explorer.uri}?module=account&action=txlistinternal&address=${address}`,
    params: {
      tag: "latest",
      page: 1,
      sort: "desc",
      startBlock: fromBlock,
      endBlock: toBlock,
    },
  }).then(ops => ops.map(fixTxHash));

  // Why this thing ?
  // Multiple internal transactions can be executed from
  // a single "normal" transaction with a same hash.
  // Grouping them here helps differenciate the
  // `Operation` ids which would be identical
  // otherwise without a notion of index.
  const opsByHash: Record<string, EtherscanInternalTransaction[]> = {};
  for (const op of ops) {
    if (!opsByHash[op.hash]) {
      opsByHash[op.hash] = [];
    }
    opsByHash[op.hash].push(op);
  }

  return Object.values(opsByHash)
    .map(internalTxs =>
      internalTxs.map((internalTx, index) =>
        etherscanInternalTransactionToOperations(accountId, internalTx, index),
      ),
    )
    .flat(2);
};

/**
 * Wrapper around all operation types' requests
 *
 * ⚠ The lack of parallelization is on purpose,
 * do not use a Promise.all here, it would
 * break because of the rate limits
 */
export const getLastOperations = makeLRUCache<
  [
    currency: CryptoCurrency,
    address: string,
    accountId: string,
    fromBlock: number,
    toBlock?: number,
  ],
  {
    lastCoinOperations: Operation[];
    lastTokenOperations: Operation[];
    lastNftOperations: Operation[];
    lastInternalOperations: Operation[];
  }
>(
  async (currency, address, accountId, fromBlock, toBlock) => {
    try {
      const lastCoinOperations = await getLastCoinOperations(
        currency,
        address,
        accountId,
        fromBlock,
        toBlock,
      );

      const lastInternalOperations = await getLastInternalOperations(
        currency,
        address,
        accountId,
        fromBlock,
        toBlock,
      );

      const lastTokenOperations = await getLastTokenOperations(
        currency,
        address,
        accountId,
        fromBlock,
        toBlock,
      );

      const lastNftOperations = isNFTActive(currency)
        ? await getLastNftOperations(currency, address, accountId, fromBlock, toBlock)
        : [];

      return {
        lastCoinOperations,
        lastTokenOperations,
        lastNftOperations,
        lastInternalOperations,
      };
    } catch (err) {
      log("EVM getLastOperations", "Error while fetching data from Etherscan like API", err);
      const message =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? `${err.name} - ${err.message}`
            : JSON.stringify(err);
      throw new InvalidExplorerResponse(`${currency.name} - ${message}`, {
        currencyName: currency.name,
      });
    }
  },
  (_currency, _address, accountId, fromBlock, toBlock) => accountId + fromBlock + toBlock,
  { ttl: ETHERSCAN_TIMEOUT },
);

const explorerApi: ExplorerApi = {
  getLastOperations,
};

const explorerApiNoChache: ExplorerApi = {
  getLastOperations: getLastOperations.force,
};

export default { explorerApi, explorerApiNoChache };
