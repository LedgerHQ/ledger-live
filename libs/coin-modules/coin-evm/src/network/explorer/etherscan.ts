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
} from "../../adapters";
import { getCoinConfig } from "../../config";
import {
  EtherscanERC1155Event,
  EtherscanERC20Event,
  EtherscanERC721Event,
  EtherscanInternalTransaction,
  EtherscanOperation,
} from "../../types";
import { ExplorerApi, isEtherscanLikeExplorerConfig } from "./types";

export const ETHERSCAN_TIMEOUT = 5000; // 5 seconds between 2 calls

/**
 * Common parameters for fetching operations from an endpoint
 */
export type FetchOperationsParams = {
  currency: CryptoCurrency;
  address: string;
  accountId: string;
  fromBlock: number;
  toBlock?: number | undefined;
  limit?: number | undefined;
  sort?: "asc" | "desc" | undefined;
  page?: number | undefined;
};
export const DEFAULT_RETRIES_API = 8;

function boundBlockFromOperations(ops: Operation[]): number {
  if (ops.length === 0) return 0;
  // Results are already sorted
  // In asc mode [1, 2, 3], the bound is 3
  // In desc mode [3, 2, 1], the bound is 1
  const op = ops[ops.length - 1];
  return op.blockHeight ?? 0;
}

// Result type for individual endpoint fetches
export type EndpointResult = {
  operations: Operation[];
  hasMorePage: boolean;
  boundBlock: number;
  // true when page returned exactly `limit` results, indicating more data may exist
  // used to compute effectiveMaxBlock for the next endpoint call
  isPageFull: boolean;
};

const EMPTY_RESULT: EndpointResult = {
  operations: [],
  hasMorePage: false,
  boundBlock: 0,
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
  return limitParameter === undefined || limitParameter === 0 || operationCount >= limitParameter;
}

// Returns true when there might be more pages to fetch
// This happens when the page is full AND we actually got results
function hasMorePage(limitParameter: number | undefined, operationCount: number): boolean {
  // the notion is close to isPageFull, but it handles unlimited pages
  // also isPageFull accepts a 0 limit, while hasMorePage requires some results
  return (
    limitParameter !== undefined && isPageFull(limitParameter, operationCount) && operationCount > 0
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

/**
 * Creates a block comparator for pagination ordering.
 *
 * The comparator encodes "semantic ordering" based on pagination direction:
 * - In desc mode: higher blocks are fetched first, lower blocks come later
 * - In asc mode: lower blocks are fetched first, higher blocks come later
 *
 * The comparator returns:
 * - negative if `a` comes before `b` in pagination order (a is "semantically smaller")
 * - zero if `a` equals `b`
 * - positive if `a` comes after `b` in pagination order (a is "semantically greater")
 *
 * Example in desc mode: compare(10, 5) = 5 - 10 = -5 (block 10 comes before block 5)
 * Example in asc mode: compare(5, 10) = 5 - 10 = -5 (block 5 comes before block 10)
 */
type BlockComparator = {
  /** Compare two blocks: negative if a comes first, positive if b comes first */
  compare: (a: number, b: number) => number;
  /** Select the semantically smaller number (min in pagination order) */
  min: (a: number, b: number) => number;
  /** Check if a is semantically less than or equal to b */
  isLessOrEqual: (a: number, b: number) => boolean;
  /** Get the next block in pagination order */
  next: (a: number) => number;
};

function createBlockComparator(order: "asc" | "desc"): BlockComparator {
  // In desc: higher blocks come first, so compare(a, b) = b - a
  // In asc: lower blocks come first, so compare(a, b) = a - b
  const compare =
    order === "asc"
      ? (a: number, b: number): number => a - b
      : (a: number, b: number): number => b - a;

  const next = order === "asc" ? (b: number): number => b + 1 : (b: number): number => b - 1;

  return {
    compare,
    min: (a: number, b: number): number => (compare(a, b) <= 0 ? a : b),
    isLessOrEqual: (a: number, b: number): boolean => compare(a, b) <= 0,
    next,
  };
}

// this function is used to optimize the fromBlock or toBlock for the next endpoint call
// if the current enpoint call returns a full page, then it's unnecessary to call the next endpoint with a toBlock higher than the maxBlock of the current page
// why ? because the operations must respect a total ordering by block height across pages
function computeEffectiveBoundBlock(
  limit: number | undefined,
  currentBoundBlock: number | undefined,
  result: EndpointResult,
  cmp: BlockComparator,
): number | undefined {
  // when page are unlimited, we don't adjust the maxBlock
  if (
    limit !== undefined &&
    result.isPageFull &&
    result.operations.length > 0 &&
    result.boundBlock > 0
  ) {
    if (currentBoundBlock === undefined) {
      return result.boundBlock;
    }
    // Select the bound that comes first in pagination order (semantically smaller)
    // This ensures we don't miss any blocks - we constrain to the most restrictive bound
    // In desc mode: this is Math.max (higher blocks come first)
    // In asc mode: this is Math.min (lower blocks come first)
    return cmp.min(currentBoundBlock, result.boundBlock);
  }
  return currentBoundBlock;
}

/**
 * Get all the latest "normal" transactions (no tokens / NFTs)
 */
export const getCoinOperations = async (params: FetchOperationsParams): Promise<EndpointResult> => {
  const config = getCoinConfig(params.currency).info;
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isEtherscanLikeExplorerConfig(explorer)) {
    throw new EtherscanLikeExplorerUsedIncorrectly();
  }

  const url =
    explorer.type === "corescan"
      ? `${explorer.uri}/accounts/list_of_txs_by_address/${params.address}`
      : `${explorer.uri}?module=account&action=txlist&address=${params.address}`;

  const ops = await fetchWithRetries<EtherscanOperation[]>({
    method: "GET",
    url,
    params: {
      tag: "latest",
      page: params.page ?? 1,
      ...(params.limit !== undefined && { offset: params.limit }),
      sort: params.sort ?? "desc",
      startBlock: params.fromBlock,
      endBlock: params.toBlock,
    },
  });

  const operations = ops.map(tx => etherscanOperationToOperations(params.accountId, tx)).flat();
  const maxBlock = boundBlockFromOperations(operations);

  return {
    operations,
    hasMorePage: hasMorePage(params.limit, ops.length),
    boundBlock: maxBlock,
    isPageFull: isPageFull(params.limit, ops.length),
  };
};

/**
 * Get all the latest ERC20 transactions
 */
export const getTokenOperations = async (
  params: FetchOperationsParams,
): Promise<EndpointResult> => {
  const config = getCoinConfig(params.currency).info;
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isEtherscanLikeExplorerConfig(explorer)) {
    throw new EtherscanLikeExplorerUsedIncorrectly();
  }

  const url =
    explorer.type === "corescan"
      ? `${explorer.uri}/accounts/list_of_erc20_transfer_events_by_address/${params.address}`
      : `${explorer.uri}?module=account&action=tokentx&address=${params.address}`;

  const ops = await fetchWithRetries<EtherscanERC20Event[]>({
    method: "GET",
    url,
    params: {
      tag: "latest",
      page: params.page ?? 1,
      ...(params.limit !== undefined && { offset: params.limit }),
      sort: params.sort ?? "desc",
      startBlock: params.fromBlock,
      endBlock: params.toBlock,
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
    events.flatMap((event, index) =>
      etherscanERC20EventToOperations(params.accountId, event, index),
    ),
  );
  const maxBlock = boundBlockFromOperations(operations);

  return {
    operations,
    hasMorePage: hasMorePage(params.limit, ops.length),
    boundBlock: maxBlock,
    isPageFull: isPageFull(params.limit, ops.length),
  };
};

/**
 * Get all the latest ERC721 transactions
 */
export const getERC721Operations = async (
  params: FetchOperationsParams,
): Promise<EndpointResult> => {
  const config = getCoinConfig(params.currency).info;
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isEtherscanLikeExplorerConfig(explorer)) {
    throw new EtherscanLikeExplorerUsedIncorrectly();
  }

  const url =
    explorer.type === "corescan"
      ? `${explorer.uri}/accounts/list_of_erc721_transfer_events_by_address/${params.address}`
      : `${explorer.uri}?module=account&action=tokennfttx&address=${params.address}`;

  const ops = await fetchWithRetries<EtherscanERC721Event[]>({
    method: "GET",
    url,
    params: {
      tag: "latest",
      page: params.page ?? 1,
      ...(params.limit !== undefined && { offset: params.limit }),
      sort: params.sort ?? "desc",
      startBlock: params.fromBlock,
      endBlock: params.toBlock,
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
    events.flatMap((event, index) =>
      etherscanERC721EventToOperations(params.accountId, event, index),
    ),
  );
  const maxBlock = boundBlockFromOperations(operations);

  return {
    operations,
    hasMorePage: hasMorePage(params.limit, ops.length),
    boundBlock: maxBlock,
    isPageFull: isPageFull(params.limit, ops.length),
  };
};

/**
 * Get all the latest ERC1155 transactions
 */
export const getERC1155Operations = async (
  params: FetchOperationsParams,
): Promise<EndpointResult> => {
  const config = getCoinConfig(params.currency).info;
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
    url: `${explorer.uri}?module=account&action=token1155tx&address=${params.address}`,
    params: {
      tag: "latest",
      page: params.page ?? 1,
      ...(params.limit !== undefined && { offset: params.limit }),
      sort: params.sort ?? "desc",
      startBlock: params.fromBlock,
      endBlock: params.toBlock,
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
    events.flatMap((event, index) =>
      etherscanERC1155EventToOperations(params.accountId, event, index),
    ),
  );
  const maxBlock = boundBlockFromOperations(operations);

  return {
    operations,
    hasMorePage: hasMorePage(params.limit, ops.length),
    boundBlock: maxBlock,
    isPageFull: isPageFull(params.limit, ops.length),
  };
};

/**
 * Get all NFT related operations (ERC721 + ERC1155)
 */
export const getNftOperations = async (params: FetchOperationsParams): Promise<EndpointResult> => {
  const config = getCoinConfig(params.currency).info;
  if (!config.showNfts) {
    return EMPTY_RESULT;
  }

  const erc721Result = await getERC721Operations(params);
  const erc1155Result = await getERC1155Operations(params);

  const sort = params.sort ?? "desc";
  const operations = [...erc721Result.operations, ...erc1155Result.operations].sort(
    // sorting by date based on sort parameter
    (a, b) =>
      sort === "desc" ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime(),
  );
  const maxBlock = Math.max(erc721Result.boundBlock, erc1155Result.boundBlock);

  return {
    operations,
    hasMorePage: erc721Result.hasMorePage || erc1155Result.hasMorePage,
    boundBlock: maxBlock,
    isPageFull: erc721Result.isPageFull || erc1155Result.isPageFull,
  };
};

/**
 * Get all the latest internal transactions
 */
export const getInternalOperations = async (
  params: FetchOperationsParams,
): Promise<EndpointResult> => {
  const config = getCoinConfig(params.currency).info;
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
    url: `${explorer.uri}?module=account&action=txlistinternal&address=${params.address}`,
    params: {
      tag: "latest",
      page: params.page ?? 1,
      ...(params.limit !== undefined && { offset: params.limit }),
      sort: params.sort ?? "desc",
      startBlock: params.fromBlock,
      endBlock: params.toBlock,
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
      etherscanInternalTransactionToOperations(params.accountId, internalTx, index),
    ),
  );
  const maxBlock = boundBlockFromOperations(operations);

  return {
    operations,
    hasMorePage: hasMorePage(params.limit, ops.length),
    boundBlock: maxBlock,
    isPageFull: isPageFull(params.limit, ops.length),
  };
};

/**
 * Type for endpoint getter functions
 */
export type FetchOperations = (params: FetchOperationsParams) => Promise<EndpointResult>;

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
  params: FetchOperationsParams,
): Promise<EndpointResult> {
  const { limit } = params;
  const fetchPage = (
    page: number,
    limitOverride: number | undefined = limit,
  ): Promise<EndpointResult> => fetchOperations({ ...params, limit: limitOverride, page });

  // in unlimited mode, just let fetch the page
  if (limit === undefined) {
    return fetchPage(1);
  }

  let currentPageNumber = 1;
  // call first page with a limit + 1 to check if we need to fetch a 2nd page
  const firstPage = await fetchPage(currentPageNumber, limit + 1);
  // if the page is not full there is nothing to exhaust and the limit input is honored
  if (!firstPage.isPageFull) {
    // this is a bit hacky but we need to recompute isPageFull
    // because the first page may have been fetched with a limit + 1
    // in case we have ops.length == limit, then isPageFull should be true
    return { ...firstPage, isPageFull: isPageFull(limit, firstPage.operations.length) };
  }

  // this is an optimization to avoid fetching the next page if the last 2 ops are not at the same block height (most likely case)
  // if the last 2 ops are at the same block height, we need to fetch the next pages
  // otherwise we can stop here (no heights spreading across pages)
  const lastTwoOps = firstPage.operations.slice(-2);
  if (lastTwoOps.length === 2 && lastTwoOps[0].blockHeight !== lastTwoOps[1].blockHeight) {
    // return the first page with the last op removed to honor the limit
    // and we also know there are more pages to fetch
    const butLastOps = firstPage.operations.slice(0, -1);
    const fixedBoundBlock = boundBlockFromOperations(butLastOps);
    return { ...firstPage, hasMorePage: true, operations: butLastOps, boundBlock: fixedBoundBlock };
  }

  const allOperations = [...firstPage.operations];

  let nextPage: EndpointResult;
  let boundaryOps: EndpointResult["operations"];

  do {
    currentPageNumber++;
    // here we call with limit + 1 so that endpoint pagination doesn't break
    nextPage = await fetchPage(currentPageNumber, limit + 1);

    boundaryOps = nextPage.operations.filter(op => (op.blockHeight ?? 0) === firstPage.boundBlock);
    allOperations.push(...boundaryOps);
    // Continue while all ops are at boundary block AND page is full (more pages might exist)
  } while (
    boundaryOps.length === nextPage.operations.length &&
    nextPage.isPageFull &&
    nextPage.hasMorePage
  );

  // hasMorePage = true if we found ops at other blocks, otherwise use last page's status
  const hasOpsAtOtherBlocks = boundaryOps.length < nextPage.operations.length;
  const hasMorePage = hasOpsAtOtherBlocks ? true : nextPage.hasMorePage;

  return { ...firstPage, operations: allOperations, hasMorePage, isPageFull: firstPage.isPageFull };
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
      const paginationBlock = deserializePagingToken(pagingToken);
      let currentBoundBlock: number | undefined = undefined;

      const cmp = createBlockComparator(order);

      const baseParams: FetchOperationsParams = {
        currency,
        address,
        accountId,
        fromBlock,
        toBlock,
        limit,
        sort: order,
      };

      // TODO remove the boundBlock parameter and use the currentBoundBlock instead in the closure
      async function callEndpoint(
        endpoint: FetchOperations,
        boundBlock: number | undefined,
      ): Promise<EndpointResult> {
        // in asc mode, the cursor is the toBlock
        // in desc mode the cursor is the fromBlock
        // note that user input is discarded in favor of the bound block and the pagination
        if (order === "asc") {
          return await exhaustEndpoint(endpoint, {
            ...baseParams,
            fromBlock: paginationBlock || fromBlock,
            toBlock: boundBlock || toBlock,
          });
        } else {
          return await exhaustEndpoint(endpoint, {
            ...baseParams,
            fromBlock: boundBlock || fromBlock,
            toBlock: paginationBlock || toBlock,
          });
        }
      }

      // endpoint calls are sorted by likelyhood of having more operations than the next

      const coinResult = await callEndpoint(getCoinOperations, currentBoundBlock);
      currentBoundBlock = computeEffectiveBoundBlock(limit, currentBoundBlock, coinResult, cmp);

      const internalResult = await callEndpoint(getInternalOperations, currentBoundBlock);
      currentBoundBlock = computeEffectiveBoundBlock(limit, currentBoundBlock, internalResult, cmp);

      const tokenResult = await callEndpoint(getTokenOperations, currentBoundBlock);
      currentBoundBlock = computeEffectiveBoundBlock(limit, currentBoundBlock, tokenResult, cmp);

      const nftResult = isNFTActive(currency)
        ? await callEndpoint(getNftOperations, currentBoundBlock)
        : EMPTY_RESULT;
      currentBoundBlock = computeEffectiveBoundBlock(limit, currentBoundBlock, nftResult, cmp);

      // All done when no endpoint has more pages to fetch
      const allDone = !(
        coinResult.hasMorePage ||
        internalResult.hasMorePage ||
        tokenResult.hasMorePage ||
        nftResult.hasMorePage
      );

      const nextBoundBlock =
        currentBoundBlock !== undefined ? cmp.next(currentBoundBlock) : undefined;
      // drop operations below/above the currentBoundBlock
      const respectsBoundBlock = (op: Operation): boolean =>
        currentBoundBlock === undefined ||
        (op.blockHeight !== null &&
          op.blockHeight !== undefined &&
          cmp.isLessOrEqual(op.blockHeight, currentBoundBlock));

      return {
        lastCoinOperations: coinResult.operations.filter(respectsBoundBlock),
        lastTokenOperations: tokenResult.operations.filter(respectsBoundBlock),
        lastNftOperations: nftResult.operations.filter(respectsBoundBlock),
        lastInternalOperations: internalResult.operations.filter(respectsBoundBlock),
        nextPagingToken: serializePagingToken(nextBoundBlock, allDone),
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
