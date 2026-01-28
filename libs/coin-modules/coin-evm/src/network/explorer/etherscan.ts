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

// TODO exclude this change in commits
export const ETHERSCAN_TIMEOUT = 4000; // 5 seconds between 2 calls
export const DEFAULT_RETRIES_API = 2;

function getBlockBoundFromOperations(ops: Operation[]): number {
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
    console.log("🦄 fetchWithRetries", params);
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
  return (
    !(limitParameter === undefined) &&
    isPageFull(limitParameter, operationCount) &&
    operationCount > 0
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

// this function is used to optimize the fromBlock or toBlock for the next endpoint call
// if the current enpoint call returns a full page, then it's unnecessary to call the next endpoint with a toBlock higher than the maxBlock of the current page
// why ? because the operations must respect a total ordering by block height across pages
function updateEffectiveBoundBlock(
  limit: number | undefined,
  currentBoundBlock: number | undefined,
  result: EndpointResult,
): number | undefined {
  // the currentBoundBlock must be "logically greater than or equal to" the result.boundBlock
  // TODO < or > : assert(currentBoundBlock === undefined || currentBoundBlock >= result.boundBlock)
  // when page are unlimited, we don't adjust the maxBlock
  if (limit !== undefined && result.isPageFull && result.operations.length > 0 && result.boundBlock > 0) {
    return currentBoundBlock !== undefined ? Math.min(currentBoundBlock, result.boundBlock) : result.boundBlock;
  }
  return currentBoundBlock;
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
  const maxBlock = getBlockBoundFromOperations(operations);

  return {
    operations,
    hasMorePage: hasMorePage(limit, ops.length),
    boundBlock: maxBlock,
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
  const maxBlock = getBlockBoundFromOperations(operations);

  return {
    operations,
    hasMorePage: hasMorePage(limit, ops.length),
    boundBlock: maxBlock,
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
  const maxBlock = getBlockBoundFromOperations(operations);

  return {
    operations,
    hasMorePage: hasMorePage(limit, ops.length),
    boundBlock: maxBlock,
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
  const maxBlock = getBlockBoundFromOperations(operations);

  return {
    operations,
    hasMorePage: hasMorePage(limit, ops.length),
    boundBlock: maxBlock,
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
  const maxBlock = getBlockBoundFromOperations(operations);

  return {
    operations,
    hasMorePage: hasMorePage(limit, ops.length),
    boundBlock: maxBlock,
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
    // TODO for the next page, we could narrow the block range to the boundBlock of the first page
    fetchOperations(currency, address, accountId, fromBlock, toBlock, limit, sort, page);

  let currentPageNumber = 1;
  const firstPage = await fetchPage(currentPageNumber);
  console.log("🦄 firstPage", { isPageFull: firstPage.isPageFull, hasMorePage: firstPage.hasMorePage, boundBlock: firstPage.boundBlock, nbOperations: firstPage.operations.length });

  // TODO see if we could converge isPageFull and hasMorePage into a single boolean

  // if the page is not full or no mor pages, there is nothing to exhaust
  if (!firstPage.isPageFull || !firstPage.hasMorePage) {
    return firstPage;
  }

  const allOperations = [...firstPage.operations];

  let nextPage: EndpointResult;
  let boundaryOps: EndpointResult["operations"];

  // FIXME it possibly make a new page query where we ditch all the the operations from it in most cases
  // so I suggest to keep every operations of 2nd page (or 3rd if all 2nd are at the boundary block height) 
  // except the ones at the boundary block height of the 2nd page
  // with a limit of 3:
  // - example: pages: [[1, 2, 3], [3, 3, 3], [3, 4, 5]]
  // with present algorithm we keep [(1, 2, 3), (3, 3, 3), (3)] but we could keep [(1, 2, 3), (3, 3, 3), (3, 4)]
  // - example pages: [[1, 2, 3], [3, 3, 3], []]
  // with present algorithm we keep [(1, 2, 3), (3, 3, 3)], same with new algo
  // -example pages: [[1, 2, 3], [3, 3, 3], [3, 3]]
  // with present algorithm we keep [(1, 2, 3), (3, 3, 3), (3, 3)] same with new algo
  // - example pages: [[1, 2, 3], [3, 3, 3], [4]]
  // with present algorithm we keep [(1, 2, 3), (3, 3, 3)] same with new algo
  // - example pages: [[1, 2, 3], [3, 3, 3], [4, 5]]
  // with present algorithm we keep [(1, 2, 3), (3, 3)] but we could keep [(1, 2, 3), (3, 3, 3), (4, 5)]
  // but this algo would defeat the cascading optimization of calls
  do {
    currentPageNumber++;
    nextPage = await fetchPage(currentPageNumber);
    console.log("🦄 nextPage", { isPageFull: nextPage.isPageFull, hasMorePage: nextPage.hasMorePage, boundBlock: nextPage.boundBlock, nbOperations: nextPage.operations.length });

    boundaryOps = nextPage.operations.filter(op => (op.blockHeight ?? 0) === firstPage.boundBlock);
    console.log("🦄 boundaryOps", boundaryOps.length);
    allOperations.push(...boundaryOps);
    // Continue while all ops are at boundary block AND page is full (more pages might exist)
  } while (boundaryOps.length === nextPage.operations.length && nextPage.isPageFull && nextPage.hasMorePage);

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

      let paginationBlock = deserializePagingToken(pagingToken);
      let currentBoundBlock = undefined

      // in asc mode we increment the bound (fromBlock) and in desc mode we decrement it (toBlock)
      const nextPaginationBlock = order === "asc" ? ((bound: number) => bound + 1) : ((bound: number) => bound - 1);

      // TODO remove the boundBlock parameter and use the currentBoundBlock instead in the closure
      async function callEndpoint(endpoint: FetchOperations, boundBlock: number | undefined) {
        // in asc mode, the cursor is the toBlock 
        // in desc mode the cursor is the fromBlock
        // note that user input is discarded in favor of the bound block and the pagination
        if (order === "asc") {
          const from = paginationBlock || fromBlock;
          const to = boundBlock || toBlock;
          return await exhaustEndpoint(endpoint, currency, address, accountId, from, to, limit, order);
        } else {
          const from = boundBlock || fromBlock;
          const to = paginationBlock || toBlock;
          return await exhaustEndpoint(endpoint, currency, address, accountId, from, to, limit, order); 
        }
      }

      // endpoint calls are sorted by likelyhood of having more operations than the next

      // coins
      console.log("🦄 callEndpoint getCoinOperations", paginationBlock, currentBoundBlock);
      const coinResult = await callEndpoint(getCoinOperations, currentBoundBlock);
      currentBoundBlock = updateEffectiveBoundBlock(limit, currentBoundBlock, coinResult);

      // internal operations
      console.log("🦄 callEndpoint getInternalOperations", paginationBlock, currentBoundBlock);
      const internalResult = await callEndpoint(getInternalOperations, currentBoundBlock);
      currentBoundBlock = updateEffectiveBoundBlock(limit, currentBoundBlock, internalResult);

      // tokens
      console.log("🦄 callEndpoint getTokenOperations", paginationBlock, currentBoundBlock);
      const tokenResult = await callEndpoint(getTokenOperations, currentBoundBlock);
      currentBoundBlock = updateEffectiveBoundBlock(limit, currentBoundBlock, tokenResult);

      // nfts
      console.log("🦄 callEndpoint getNftOperations", paginationBlock, currentBoundBlock);
      const nftResult = isNFTActive(currency) ? (await callEndpoint(getNftOperations, currentBoundBlock)) : EMPTY_RESULT;
      currentBoundBlock = updateEffectiveBoundBlock(limit, currentBoundBlock, nftResult);

      // All done when no endpoint has more pages to fetch
      const hasMore = !(
        coinResult.hasMorePage ||
        internalResult.hasMorePage ||
        tokenResult.hasMorePage ||
        nftResult.hasMorePage
      );

      const nextBoundBlock = currentBoundBlock !== undefined ? nextPaginationBlock(currentBoundBlock) : undefined;
      return {
        lastCoinOperations: coinResult.operations,
        lastTokenOperations: tokenResult.operations,
        lastNftOperations: nftResult.operations,
        lastInternalOperations: internalResult.operations,
        nextPagingToken: serializePagingToken(nextBoundBlock, hasMore),
      };
    } catch (err) {
      console.log("🦄 getOperations error", err);
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
