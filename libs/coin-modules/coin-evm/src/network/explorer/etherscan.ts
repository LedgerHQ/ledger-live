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
  deserializePagingToken,
  serializePagingToken,
  getMaxBlockFromOperations,
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


// Result type for individual endpoint fetches
export type EndpointResult = {
  operations: Operation[];
  done: boolean;
  maxBlock: number;
  // true when page returned exactly `limit` results, indicating more data may exist
  // used to compute effectiveMaxBlock for the next endpoint call
  isPageFull: boolean;
};

const EMPTY_RESULT: EndpointResult = {
  operations: [],
  done: true,
  maxBlock: 0,
  isPageFull: false,
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

function isPageFull(limitParameter: number | undefined, operationCount: number): boolean {
  return (
    limitParameter === 0 || (limitParameter !== undefined && operationCount === limitParameter)
  );
}

function groupByHash<T extends { hash: string }>(items: T[]): Record<string, T[]> {
  const byHash: Record<string, T[]> = {};
  for (const item of items) {
    if (!byHash[item.hash]) {
      byHash[item.hash] = [];
    }
    byHash[item.hash].push(item);
  }
  return byHash;
}

// this function is used to optimize the toBlock for the next endpoint call
// if the current enpoint call returns a full page, then it's unnecessary to call the next endpoint with a toBlock higher than the maxBlock of the current page
// why ? because the operations must respect a total ordering by block height across pages
function updateEffectiveMaxBlock(
  current: number | undefined,
  result: EndpointResult,
): number | undefined {
  if (result.isPageFull && (result.operations.length > 0 && result.maxBlock > 0) ){
    return current !== undefined ? Math.min(current, result.maxBlock) : result.maxBlock;
  }
  return current;
}

/**
 * Get all the latest "normal" transactions (no tokens / NFTs)
 */
export const getCoinOperations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
  limit?: number,
  sort: "asc" | "desc" = "desc",
  page: number = 1,
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
      page,
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
    isPageFull: isPageFull(limit, ops.length),
  };
};

/**
 * Get all the latest ERC20 transactions
 */
export const getTokenOperations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
  limit?: number,
  sort: "asc" | "desc" = "desc",
  page: number = 1,
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
      page,
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
  const opsByHash = groupByHash(ops);

  const operations = Object.values(opsByHash).flatMap(events =>
    events.flatMap((event, index) => etherscanERC20EventToOperations(accountId, event, index)),
  );
  const maxBlock = getMaxBlockFromOperations(operations, sort);

  return {
    operations,
    done: ops.length === 0,
    maxBlock,
    isPageFull: isPageFull(limit, ops.length),
  };
};

/**
 * Get all the latest ERC721 transactions
 */
export const getERC721Operations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
  limit?: number,
  sort: "asc" | "desc" = "desc",
  page: number = 1,
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
      page,
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
  const opsByHash = groupByHash(ops);

  const operations = Object.values(opsByHash).flatMap(events =>
    events.flatMap((event, index) => etherscanERC721EventToOperations(accountId, event, index)),
  );
  const maxBlock = getMaxBlockFromOperations(operations, sort);

  return {
    operations,
    done: ops.length === 0,
    maxBlock,
    isPageFull: isPageFull(limit, ops.length),
  };
};

/**
 * Get all the latest ERC1155 transactions
 */
export const getERC1155Operations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
  limit?: number,
  sort: "asc" | "desc" = "desc",
  page: number = 1,
): Promise<EndpointResult> => {
  const config = getCoinConfig(currency).info;
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isEtherscanLikeExplorerConfig(explorer)) {
    throw new EtherscanLikeExplorerUsedIncorrectly();
  }

  // Blockscout and Corescan have no ERC1155 support yet
  if (["blockscout", "corescan"].includes(explorer.type)) {
    return EMPTY_RESULT;
  }

  const ops = await fetchWithRetries<EtherscanERC1155Event[]>({
    method: "GET",
    url: `${explorer.uri}?module=account&action=token1155tx&address=${address}`,
    params: {
      tag: "latest",
      page,
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
  const opsByHash = groupByHash(ops);

  const operations = Object.values(opsByHash).flatMap(events =>
    events.flatMap((event, index) => etherscanERC1155EventToOperations(accountId, event, index)),
  );
  const maxBlock = getMaxBlockFromOperations(operations, sort);

  return {
    operations,
    done: ops.length === 0,
    maxBlock,
    isPageFull: isPageFull(limit, ops.length),
  };
};

/**
 * Get all NFT related operations (ERC721 + ERC1155)
 */
export const getNftOperations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
  limit?: number,
  sort: "asc" | "desc" = "desc",
  page: number = 1,
): Promise<EndpointResult> => {
  const config = getCoinConfig(currency).info;
  if (!config.showNfts) {
    return EMPTY_RESULT;
  }

  const erc721Result = await getERC721Operations(
    currency,
    address,
    accountId,
    fromBlock,
    toBlock,
    limit,
    sort,
    page,
  );
  const erc1155Result = await getERC1155Operations(
    currency,
    address,
    accountId,
    fromBlock,
    toBlock,
    limit,
    sort,
    page,
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
    isPageFull: erc721Result.isPageFull || erc1155Result.isPageFull,
  };
};

/**
 * Get all the latest internal transactions
 */
export const getInternalOperations = async (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
  limit?: number,
  sort: "asc" | "desc" = "desc",
  page: number = 1,
): Promise<EndpointResult> => {
  const config = getCoinConfig(currency).info;
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isEtherscanLikeExplorerConfig(explorer)) {
    throw new EtherscanLikeExplorerUsedIncorrectly();
  }

  // Corescan has no support to get internal operations by address
  if (explorer.type === "corescan") {
    return EMPTY_RESULT;
  }

  const ops = await fetchWithRetries<EtherscanInternalTransaction[]>({
    method: "GET",
    url: `${explorer.uri}?module=account&action=txlistinternal&address=${address}`,
    params: {
      tag: "latest",
      page,
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
  const opsByHash = groupByHash(ops);

  const operations = Object.values(opsByHash).flatMap(internalTxs =>
    internalTxs.flatMap((internalTx, index) =>
      etherscanInternalTransactionToOperations(accountId, internalTx, index),
    ),
  );
  const maxBlock = getMaxBlockFromOperations(operations, sort);

  return {
    operations,
    done: ops.length === 0,
    maxBlock,
    isPageFull: isPageFull(limit, ops.length),
  };
};

/**
 * Type for endpoint getter functions
 */
export type FetchOperations = (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
  limit?: number,
  sort?: "asc" | "desc",
  page?: number,
) => Promise<EndpointResult>;

/**
 * Fetches operations from an endpoint and exhausts the boundary block if the page is full.
 *
 * When a page is full (returns exactly `limit` operations), there may be more operations
 * at the same max block height H1 that didn't fit in the current page. If we simply move
 * to minHeight = H1 + 1 without exhausting H1, we would lose those remaining operations
 * on the next page.
 *
 * This helper continues fetching pages while the page is full AND all operations are at
 * the same boundary block height than the first page. 
 * This ensures we get all operations at H1.
 *
 * @returns An aggregated EndpointResult with operations from one or more pages with guarantee that no operation exceed the highest block height of the first page.
 */
export async function exhaustEndpoint(
  fetchOperations: FetchOperations,
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock: number | undefined,
  limit: number | undefined,
  sort: "asc" | "desc",
): Promise<EndpointResult> {
  const fetchPage = (page: number): Promise<EndpointResult> =>
    fetchOperations(currency, address, accountId, fromBlock, toBlock, limit, sort, page);

  let currentPageNumber = 1;
  const firstPage = await fetchPage(currentPageNumber);

  // if the page is not full, there is nothing to exhaust
  if (!firstPage.isPageFull) {
    return firstPage;
  }

  const allOperations = [...firstPage.operations];

  let nextPage: EndpointResult;
  let boundaryOps: EndpointResult["operations"];
  do {
    nextPage = await fetchPage(++currentPageNumber);
    boundaryOps = nextPage.operations.filter(
      op => (op.blockHeight ?? 0) === firstPage.maxBlock,
    );
    allOperations.push(...boundaryOps);
    // Continue while all ops are at boundary block AND page is full (more pages might exist)
  } while (boundaryOps.length === nextPage.operations.length && nextPage.isPageFull);

  // done = false if we found ops at other blocks, otherwise use last page's done status
  const hasOpsAtOtherBlocks = boundaryOps.length < nextPage.operations.length;
  const done = hasOpsAtOtherBlocks ? false : nextPage.done;

  return { ...firstPage, operations: allOperations, done, isPageFull: firstPage.isPageFull };
}

/**
 * Wrapper around all operation types' requests
 *
 * ⚠ The lack of parallelization is on purpose,
 * do not use a Promise.all here, it would
 * break because of the rate limits
 *
 * This function implements total ordering across pages by:
 * 1. Calculating effectiveToBlock from limit if not provided
 * 2. Exhausting boundary blocks to avoid losing operations
 * 3. Cascading effectiveMaxBlock to constrain subsequent endpoints
 */
export const getOperations = makeLRUCache<
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
      // With total ordering, all endpoints use the same fromBlock
      const currentFromBlock = deserializePagingToken(pagingToken, fromBlock);

      // Track effectiveMaxBlock that cascades through sequential endpoint calls
      // When an endpoint returns a full page of operations, subsequent endpoints use this as their toBlock
      // to ensure all endpoints operate within the same block range for total ordering
      let effectiveMaxBlock = toBlock;

      // Fetch coin operations and exhaust boundary block
      const coinResult = await exhaustEndpoint(
        getCoinOperations,
        currency,
        address,
        accountId,
        currentFromBlock,
        effectiveMaxBlock,
        limit,
        order,
      );

      effectiveMaxBlock = updateEffectiveMaxBlock(effectiveMaxBlock, coinResult);

      // Fetch internal operations with cascaded effectiveMaxBlock
      const internalResult = await exhaustEndpoint(
        getInternalOperations,
        currency,
        address,
        accountId,
        currentFromBlock,
        effectiveMaxBlock,
        limit,
        order,
      );

      effectiveMaxBlock = updateEffectiveMaxBlock(effectiveMaxBlock, internalResult);

      // Fetch token operations with cascaded effectiveMaxBlock
      const tokenResult = await exhaustEndpoint(
        getTokenOperations,
        currency,
        address,
        accountId,
        currentFromBlock,
        effectiveMaxBlock,
        limit,
        order,
      );

      effectiveMaxBlock = updateEffectiveMaxBlock(effectiveMaxBlock, tokenResult);

      // Fetch NFT operations with cascaded effectiveMaxBlock
      const nftResult = isNFTActive(currency)
        ? await exhaustEndpoint(
          getNftOperations,
          currency,
          address,
          accountId,
          currentFromBlock,
          effectiveMaxBlock,
          limit,
          order,
        )
        : EMPTY_RESULT;

      // Compute next fromBlock as max of all endpoints' maxBlocks + 1
      const maxBlock = Math.max(
        coinResult.maxBlock,
        internalResult.maxBlock,
        tokenResult.maxBlock,
        nftResult.maxBlock,
      );
      const nextFromBlock = maxBlock > 0 ? maxBlock + 1 : currentFromBlock;

      // All done when all endpoints have no more data
      const allDone =
        coinResult.done && internalResult.done && tokenResult.done && nftResult.done;

      return {
        lastCoinOperations: coinResult.operations,
        lastTokenOperations: tokenResult.operations,
        lastNftOperations: nftResult.operations,
        lastInternalOperations: internalResult.operations,
        nextPagingToken: serializePagingToken(nextFromBlock, allDone),
      };
    } catch (err) {
      log("EVM getOperations", "Error while fetching data from Etherscan like API", err);
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
  getOperations,
};

const explorerApiNoCache: ExplorerApi = {
  getOperations: getOperations.force,
};

export default { explorerApi, explorerApiNoCache };
