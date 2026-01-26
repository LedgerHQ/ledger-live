import { delay } from "@ledgerhq/live-promise";
import { Operation } from "@ledgerhq/types-live";
import axios, { AxiosRequestConfig } from "axios";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";
import { log } from "@ledgerhq/logs";
import {
  EtherscanAPIError,
  EtherscanLikeExplorerUsedIncorrectly,
  InvalidExplorerResponse,
} from "../../errors";
import {
  etherscanOperationToOperations,
  etherscanERC20EventToOperations,
  etherscanERC721EventToOperations,
  etherscanERC1155EventToOperations,
  etherscanInternalTransactionToOperations,
} from "../../adapters";
import { getCoinConfig } from "../../config";
import {
  EtherscanERC1155Event,
  EtherscanERC20Event,
  EtherscanERC721Event,
  EtherscanInternalTransaction,
  EtherscanOperation,
} from "../../types";
import { ExplorerApi, isEtherscanLikeExplorerConfig, NO_TOKEN } from "./types";

export const ETHERSCAN_TIMEOUT = 5000; // 5 seconds between 2 calls
export const DEFAULT_RETRIES_API = 8;

// Pagination state types for height-based pagination
type EndpointState = {
  lastBlock: number; // Last block height processed
  done: boolean; // No more results from this endpoint
};

// Pagination state for etherscan API
// each endpoint has its own state
type EtherscanPaginationState = {
  coin: EndpointState;
  internal: EndpointState;
  token: EndpointState;
  nft: EndpointState;
};

function createDefaultState(minHeight: number): EtherscanPaginationState {
  return {
    coin: { lastBlock: minHeight, done: false },
    internal: { lastBlock: minHeight, done: false },
    token: { lastBlock: minHeight, done: false },
    nft: { lastBlock: minHeight, done: false },
  };
}

export function deserializePagingToken(
  token: string | undefined,
  minHeight: number,
): EtherscanPaginationState {
  if (!token) return createDefaultState(minHeight);
  // if deserialization fails, an error is thrown
  return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
}

export function serializePagingToken(state: EtherscanPaginationState): string {
  const allDone = Object.values(state).every(s => s.done);
  if (allDone) return NO_TOKEN;
  return Buffer.from(JSON.stringify(state)).toString("base64");
}

function getMaxBlockFromOperations(ops: Operation[], sort: "asc" | "desc"): number {
  if (ops.length === 0) return 0;
  // Results are already sorted, take head for desc or tail for asc
  const op = sort === "desc" ? ops[0] : ops[ops.length - 1];
  return op.blockHeight ?? 0;
}

// Result type for individual endpoint fetches
type EndpointResult = {
  operations: Operation[];
  done: boolean;
  maxBlock: number;
};

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
  limit?: number,
  sort: "asc" | "desc" = "desc",
): Promise<EndpointResult> => {
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
      ...(limit !== undefined && { offset: limit }),
      sort,
      startBlock: fromBlock,
      endBlock: toBlock,
    },
  });

  const operations = ops.map(tx => etherscanOperationToOperations(accountId, tx)).flat();
  const maxBlock = getMaxBlockFromOperations(operations, sort);

  return {
    operations,
    done: ops.length === 0,
    maxBlock,
  };
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
  limit?: number,
  sort: "asc" | "desc" = "desc",
): Promise<EndpointResult> => {
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
      ...(limit !== undefined && { offset: limit }),
      sort,
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

  const operations = allOperationsArrays.flat(2);
  const maxBlock = getMaxBlockFromOperations(operations, sort);

  return {
    operations,
    done: ops.length === 0,
    maxBlock,
  };
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
  limit?: number,
  sort: "asc" | "desc" = "desc",
): Promise<EndpointResult> => {
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
      ...(limit !== undefined && { offset: limit }),
      sort,
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

  const operations = Object.values(opsByHash)
    .map(events =>
      events.map((event, index) => etherscanERC721EventToOperations(accountId, event, index)),
    )
    .flat(2);
  const maxBlock = getMaxBlockFromOperations(operations, sort);

  return {
    operations,
    done: ops.length === 0,
    maxBlock,
  };
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
  limit?: number,
  sort: "asc" | "desc" = "desc",
): Promise<EndpointResult> => {
  const config = getCoinConfig(currency).info;
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isEtherscanLikeExplorerConfig(explorer)) {
    throw new EtherscanLikeExplorerUsedIncorrectly();
  }

  // Blockscout and Corescan have no ERC1155 support yet
  if (["blockscout", "corescan"].includes(explorer.type)) {
    return { operations: [], done: true, maxBlock: 0 };
  }

  const ops = await fetchWithRetries<EtherscanERC1155Event[]>({
    method: "GET",
    url: `${explorer.uri}?module=account&action=token1155tx&address=${address}`,
    params: {
      tag: "latest",
      page: 1,
      ...(limit !== undefined && { offset: limit }),
      sort,
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

  const operations = Object.values(opsByHash)
    .map(events =>
      events.map((event, index) => etherscanERC1155EventToOperations(accountId, event, index)),
    )
    .flat(2);
  const maxBlock = getMaxBlockFromOperations(operations, sort);

  return {
    operations,
    done: ops.length === 0,
    maxBlock,
  };
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
  limit?: number,
  sort: "asc" | "desc" = "desc",
): Promise<EndpointResult> => {
  const config = getCoinConfig(currency).info;
  if (!config.showNfts) {
    return { operations: [], done: true, maxBlock: 0 };
  }

  const erc721Result = await getLastERC721Operations(
    currency,
    address,
    accountId,
    fromBlock,
    toBlock,
    limit,
    sort,
  );
  const erc1155Result = await getLastERC1155Operations(
    currency,
    address,
    accountId,
    fromBlock,
    toBlock,
    limit,
    sort,
  );

  const operations = [...erc721Result.operations, ...erc1155Result.operations].sort(
    // sorting by date based on sort parameter
    (a, b) =>
      sort === "desc" ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime(),
  );
  const maxBlock = Math.max(erc721Result.maxBlock, erc1155Result.maxBlock);

  return {
    operations,
    done: erc721Result.done && erc1155Result.done,
    maxBlock,
  };
};

/**
 * Get all the latest internal transactions
 */
export const getLastInternalOperations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
  limit?: number,
  sort: "asc" | "desc" = "desc",
): Promise<EndpointResult> => {
  const config = getCoinConfig(currency).info;
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isEtherscanLikeExplorerConfig(explorer)) {
    throw new EtherscanLikeExplorerUsedIncorrectly();
  }

  // Corescan has no support to get internal operations by address
  if (explorer.type === "corescan") return { operations: [], done: true, maxBlock: 0 };

  const ops = await fetchWithRetries<EtherscanInternalTransaction[]>({
    method: "GET",
    url: `${explorer.uri}?module=account&action=txlistinternal&address=${address}`,
    params: {
      tag: "latest",
      page: 1,
      ...(limit !== undefined && { offset: limit }),
      sort,
      startBlock: fromBlock,
      endBlock: toBlock,
    },
  });

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

  const operations = Object.values(opsByHash)
    .map(internalTxs =>
      internalTxs.map((internalTx, index) =>
        etherscanInternalTransactionToOperations(accountId, internalTx, index),
      ),
    )
    .flat(2);
  const maxBlock = getMaxBlockFromOperations(operations, sort);

  return {
    operations,
    done: ops.length === 0,
    maxBlock,
  };
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
    pagingToken?: string,
    limit?: number,
    order?: "asc" | "desc",
  ],
  {
    lastCoinOperations: Operation[];
    lastTokenOperations: Operation[];
    lastNftOperations: Operation[];
    lastInternalOperations: Operation[];
    nextPagingToken: string;
  }
>(
  async (currency, address, accountId, fromBlock, toBlock, pagingToken, limit, order = "desc") => {
    try {
      const state = deserializePagingToken(pagingToken, fromBlock);
      const emptyResult: EndpointResult = { operations: [], done: true, maxBlock: 0 };

      const coinResult = state.coin.done
        ? emptyResult
        : await getLastCoinOperations(
          currency,
          address,
          accountId,
          state.coin.lastBlock,
          toBlock,
          limit,
          order,
        );

      const internalResult = state.internal.done
        ? emptyResult
        : await getLastInternalOperations(
          currency,
          address,
          accountId,
          state.internal.lastBlock,
          toBlock,
          limit,
          order,
        );

      const tokenResult = state.token.done
        ? emptyResult
        : await getLastTokenOperations(
          currency,
          address,
          accountId,
          state.token.lastBlock,
          toBlock,
          limit,
          order,
        );

      const nftResult =
        isNFTActive(currency) && !state.nft.done
          ? await getLastNftOperations(
            currency,
            address,
            accountId,
            state.nft.lastBlock,
            toBlock,
            limit,
            order,
          )
          : emptyResult;

      // Update state with new lastBlock values
      // done = true only when results.length === 0 (conservative approach)
      const nextState: EtherscanPaginationState = {
        coin: {
          lastBlock: coinResult.maxBlock > 0 ? coinResult.maxBlock + 1 : state.coin.lastBlock,
          done: coinResult.done,
        },
        internal: {
          lastBlock:
            internalResult.maxBlock > 0 ? internalResult.maxBlock + 1 : state.internal.lastBlock,
          done: internalResult.done,
        },
        token: {
          lastBlock: tokenResult.maxBlock > 0 ? tokenResult.maxBlock + 1 : state.token.lastBlock,
          done: tokenResult.done,
        },
        nft: {
          lastBlock: nftResult.maxBlock > 0 ? nftResult.maxBlock + 1 : state.nft.lastBlock,
          done: nftResult.done || !isNFTActive(currency),
        },
      };

      return {
        lastCoinOperations: coinResult.operations,
        lastTokenOperations: tokenResult.operations,
        lastNftOperations: nftResult.operations,
        lastInternalOperations: internalResult.operations,
        nextPagingToken: serializePagingToken(nextState),
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
  (_currency, _address, accountId, fromBlock, toBlock, pagingToken, limit, order) =>
    `${accountId}:${fromBlock}:${toBlock ?? ""}:${pagingToken ?? ""}:${limit ?? ""}:${order ?? "desc"}`,
  { ttl: ETHERSCAN_TIMEOUT },
);

const explorerApi: ExplorerApi = {
  getLastOperations,
};

const explorerApiNoChache: ExplorerApi = {
  getLastOperations: getLastOperations.force,
};

export default { explorerApi, explorerApiNoChache };
