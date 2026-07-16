import URL from "url";
import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import coinConfig from "../config";
import {
  APIAccount,
  APIBlock,
  APIDelegationType,
  APIOperation,
  APIOriginationType,
  APIRevealType,
  APIStakingType,
  APITokenTransfer,
  APITransactionType,
  APIUnstakeRequest,
  AccountsGetOperationsOptions,
  TokenTransfersGetOptions,
  APITokenBalance,
} from "./types";

/** TzKT hard-caps `limit` at 10 000; we use a safer page size to stay well under that. */
const BLOCK_PAGE_SIZE = 1000;

/** Maximum number of IDs per `id.in` request to keep URLs under the Cloudflare proxy limit (~16 KB). */
const ID_IN_CHUNK_SIZE = 100;

const getExplorerUrl = () => coinConfig.getCoinConfig().explorer.url;

const clearUndefined = (obj: Record<string, unknown>) => {
  const newObj = { ...obj };
  Object.entries(newObj).forEach(([key, value]) => value === undefined && delete newObj[key]);

  return newObj;
};

/** Splits an array into chunks of at most `size` elements. */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Internal helper shared by `getOperationsTransactions` and `getOperationsOrigination`.
 * Both endpoints accept the same query shape; only the URL path differs.
 */
async function getOperationsByType(
  type: "transactions" | "originations",
  level: number,
  cursor?: number,
  apiQueryParams: Record<string, unknown> = {},
): Promise<(APITransactionType & { block: string; hash: string })[]> {
  // "sort.asc": "id" guarantees forward progress for cursor-based paging (offset.cr).
  // Without an explicit sort the API default may be descending, which would cause the
  // cursor to go backwards and produce duplicates or an infinite loop.
  const params: Record<string, unknown> = {
    "level.gte": level,
    limit: BLOCK_PAGE_SIZE,
    "sort.asc": "id",
    ...clearUndefined(apiQueryParams),
  };
  if (cursor !== undefined) params["offset.cr"] = cursor;
  const { data } = await network<(APITransactionType & { block: string; hash: string })[]>({
    url: `${getExplorerUrl()}/v1/operations/${type}`,
    params,
  });
  return data;
}

const api = {
  async getBlockCount(): Promise<number> {
    const { data } = await network<number>({
      url: `${getExplorerUrl()}/v1/blocks/count`,
    });
    return data;
  },
  async getLastBlock(): Promise<{ hash: string; level: number; date: Date }> {
    const { data } = await network<APIBlock[]>({
      url: `${getExplorerUrl()}/v1/blocks`,
      params: {
        "sort.desc": "level",
      },
    });

    return {
      hash: data[0].hash,
      level: data[0].level,
      date: new Date(data[0].timestamp),
    };
  },
  async getAccountByAddress(address: string): Promise<APIAccount> {
    const { data } = await network<APIAccount>({
      url: `${getExplorerUrl()}/v1/accounts/${address}`,
    });
    return data;
  },

  /**
   * Returns the total `actualAmount` (mutez) summed over the account's `finalizable`
   * unstake requests — the portion of `unstakedBalance` whose unlock cycle has been
   * reached and that can be reclaimed via `finalize_unstake`. The complementary
   * `unstakedBalance - finalizable` portion is still in the deactivation delay window.
   *
   * TzKT's account endpoint does not expose this split, so we sum from
   * `/v1/staking/unstake_requests`. https://api.tzkt.io/#operation/Staking_GetUnstakeRequests
   *
   * `limit=1000` covers any realistic number of concurrent finalizable requests for
   * a single staker — we do not paginate.
   */
  async getUnstakeRequestsFinalizable(address: string): Promise<bigint> {
    const { data } = await network<number[]>({
      url: `${getExplorerUrl()}/v1/staking/unstake_requests`,
      params: {
        "staker.eq": address,
        status: "finalizable",
        "select.values": "actualAmount",
        limit: 1000,
      },
    });
    return data.reduce<bigint>((sum, n) => sum + BigInt(n), 0n);
  },

  /**
   * Pending + finalizable unstake requests, by id ascending. Uses `status.ne=finalized` because
   * TzKT ignores `status.in=pending,finalizable` on this endpoint and returns finalized requests.
   * https://api.tzkt.io/#operation/Staking_GetUnstakeRequests
   */
  async getUnstakeRequests(address: string): Promise<APIUnstakeRequest[]> {
    const { data } = await network<APIUnstakeRequest[]>({
      url: `${getExplorerUrl()}/v1/staking/unstake_requests`,
      params: {
        "staker.eq": address,
        "status.ne": "finalized",
        "sort.asc": "id",
        limit: 1000,
      },
    });
    return data;
  },
  // https://api.tzkt.io/#operation/Accounts_GetOperations
  async getAccountOperations(
    address: string,
    query: AccountsGetOperationsOptions,
  ): Promise<APIOperation[]> {
    // Remove undefined from query
    Object.entries(query).forEach(
      ([key, value]) => value === undefined && delete query[key as keyof typeof query],
    );
    const { data } = await network<APIOperation[]>({
      url: URL.format({
        pathname: `${getExplorerUrl()}/v1/accounts/${address}/operations`,
        query,
      }),
    });
    return data;
  },

  // https://api.tzkt.io/#operation/Blocks_GetByLevel
  async getBlockByLevel(level: number): Promise<APIBlock> {
    const { data } = await network<APIBlock>({
      url: `${getExplorerUrl()}/v1/blocks/${level}`,
    });
    return data;
  },

  /**
   * Resolves block hashes for the given levels in a single request.
   * Uses `/v1/blocks?level.in=...&select.values=level,hash`, which TzKT honours
   * (unlike `/v1/blocks/{level}?select=...`, where `select` is ignored). Used
   * for cheap backfill of `block.hash` on operations whose level is known but
   * whose response omits the block field (e.g. `/accounts/{addr}/operations`
   * for staking ops). Levels that don't resolve are absent from the result map.
   */
  async getBlockHashesByLevels(levels: readonly number[]): Promise<Map<number, string>> {
    if (levels.length === 0) return new Map();
    const { data } = await network<[number, string][]>({
      url: `${getExplorerUrl()}/v1/blocks`,
      params: {
        "level.in": levels.join(","),
        "select.values": "level,hash",
        limit: levels.length,
      },
    });
    return new Map(data);
  },

  /**
   * Fetches a single page of `transaction` operations at the given block level.
   * Internal — used by `fetchBlockTransactions` which handles pagination.
   * https://api.tzkt.io/#operation/Operations_GetTransactions
   */
  async getBlockTransactionsPage(level: number, cursor?: number): Promise<APITransactionType[]> {
    // "sort.asc": "id" guarantees forward progress for cursor-based paging (offset.cr).
    // Without an explicit sort the API default may be descending, which would cause the
    // cursor to go backwards and produce duplicates or an infinite loop.
    const params: Record<string, unknown> = { level, limit: BLOCK_PAGE_SIZE, "sort.asc": "id" };
    if (cursor !== undefined) params["offset.cr"] = cursor;
    const { data } = await network<APITransactionType[]>({
      url: `${getExplorerUrl()}/v1/operations/transactions`,
      params,
    });
    return data;
  },

  /**
   * Fetches a list of `transaction` operations after the given level.
   * https://api.tzkt.io/#operation/Operations_GetTransactions
   */
  async getOperationsTransactions(
    level: number,
    cursor?: number,
    apiQueryParams: Record<string, unknown> = {},
  ): Promise<(APITransactionType & { block: string; hash: string })[]> {
    return getOperationsByType("transactions", level, cursor, apiQueryParams);
  },

  /**
   * Fetches a list of `originations` operations after the given level.
   * https://api.tzkt.io/#operation/Operations_GetOriginations
   */
  async getOperationsOrigination(
    level: number,
    cursor?: number,
    apiQueryParams: Record<string, unknown> = {},
  ): Promise<(APITransactionType & { block: string; hash: string })[]> {
    return getOperationsByType("originations", level, cursor, apiQueryParams);
  },

  /**
   * Fetches a single page of FA token transfers at the given block level.
   * Internal — used by `fetchBlockTokenTransfers` which handles pagination.
   * https://api.tzkt.io/#operation/Tokens_GetTokenTransfers
   */
  async getBlockTokenTransfersPage(level: number, cursor?: number): Promise<APITokenTransfer[]> {
    // Same rationale as getBlockTransactionsPage: explicit ascending sort keeps the
    // offset.cr cursor advancing forward regardless of the API's default ordering.
    const params: Record<string, unknown> = {
      level,
      limit: BLOCK_PAGE_SIZE,
      "sort.asc": "id",
      "token.standard": "fa2",
    };
    if (cursor !== undefined) params["offset.cr"] = cursor;
    const { data } = await network<APITokenTransfer[]>({
      url: `${getExplorerUrl()}/v1/tokens/transfers`,
      params,
    });
    return data;
  },

  /**
   * Fetches the latest FA token transfers since the given level.
   * https://api.tzkt.io/#operation/Tokens_GetTokenTransfers
   */
  async getTokenTransfers(
    apiQueryParams: Record<string, unknown> = {},
  ): Promise<APITokenTransfer[]> {
    const params = {
      ...clearUndefined(apiQueryParams),
    };
    const { data } = await network<APITokenTransfer[]>({
      url: `${getExplorerUrl()}/v1/tokens/transfers`,
      params,
    });
    return data;
  },

  /**
   * Fetches a single page of `origination` operations at the given block level.
   * Internal — used by `fetchBlockOriginations` which handles pagination.
   * https://api.tzkt.io/#operation/Operations_GetOriginations
   */
  async getBlockOriginationsPage(level: number, cursor?: number): Promise<APIOriginationType[]> {
    const params: Record<string, unknown> = { level, limit: BLOCK_PAGE_SIZE, "sort.asc": "id" };
    if (cursor !== undefined) params["offset.cr"] = cursor;
    const { data } = await network<APIOriginationType[]>({
      url: `${getExplorerUrl()}/v1/operations/originations`,
      params,
    });
    return data;
  },

  /**
   * Fetches a single page of `reveal` operations at the given block level.
   * Internal — used by `fetchBlockReveals` which handles pagination.
   * https://api.tzkt.io/#operation/Operations_GetReveals
   */
  async getBlockRevealsPage(level: number, cursor?: number): Promise<APIRevealType[]> {
    const params: Record<string, unknown> = { level, limit: BLOCK_PAGE_SIZE, "sort.asc": "id" };
    if (cursor !== undefined) params["offset.cr"] = cursor;
    const { data } = await network<APIRevealType[]>({
      url: `${getExplorerUrl()}/v1/operations/reveals`,
      params,
    });
    return data;
  },

  /**
   * Fetches a single page of `delegation` operations at the given block level.
   * Internal — used by `fetchBlockDelegations` which handles pagination.
   * https://api.tzkt.io/#operation/Operations_GetDelegations
   */
  async getBlockDelegationsPage(level: number, cursor?: number): Promise<APIDelegationType[]> {
    const params: Record<string, unknown> = { level, limit: BLOCK_PAGE_SIZE, "sort.asc": "id" };
    if (cursor !== undefined) params["offset.cr"] = cursor;
    const { data } = await network<APIDelegationType[]>({
      url: `${getExplorerUrl()}/v1/operations/delegations`,
      params,
    });
    return data;
  },

  /**
   * Fetches a single page of `staking` operations at the given block level.
   * Internal — used by `fetchBlockStaking` which handles pagination.
   * https://api.tzkt.io/#operation/Operations_GetStaking
   */
  async getBlockStakingPage(level: number, cursor?: number): Promise<APIStakingType[]> {
    const params: Record<string, unknown> = { level, limit: BLOCK_PAGE_SIZE, "sort.asc": "id" };
    if (cursor !== undefined) params["offset.cr"] = cursor;
    const { data } = await network<APIStakingType[]>({
      url: `${getExplorerUrl()}/v1/operations/staking`,
      params,
    });
    return data;
  },

  /**
   * Fetches FA2 token transfers for a given account.
   * Translates `query.sort` to TzKT's `sort.asc=id` / `sort.desc=id`.
   * The lower-level `getTokenTransfers` helper is a generic pass-through and does not pin the sort.
   * https://api.tzkt.io/#operation/Tokens_GetTokenTransfers
   */
  async getAccountTokenTransfers(
    address: string,
    query: TokenTransfersGetOptions,
  ): Promise<(APITokenTransfer & { hash: string; block: string })[]> {
    const sortKey = query.sort === "Descending" ? "sort.desc" : "sort.asc";
    const params: Record<string, unknown> = {
      "anyof.from.to": address,
      "token.standard": "fa2",
      [sortKey]: "id",
      limit: query.limit,
      "level.ge": query["level.ge"],
      "level.lt": query["level.lt"],
      "level.gt": query["level.gt"],
      "id.lt": query["id.lt"],
      "id.gt": query["id.gt"],
    };

    const data = await api.getTokenTransfers(clearUndefined(params));

    const transactionIds = data
      .map(t => t.transactionId)
      .filter((id): id is number => typeof id === "number");

    const originationIds = data
      .map(t => t.originationId)
      .filter((id): id is number => typeof id === "number");

    if (transactionIds.length === 0 && originationIds.length === 0) {
      return [];
    }

    const transactions = transactionIds.length
      ? (
          await Promise.all(
            chunk(transactionIds, ID_IN_CHUNK_SIZE).map(ids =>
              api.getOperationsTransactions(query["level.ge"] || 0, undefined, {
                "id.in": ids.join(","),
              }),
            ),
          )
        ).flat()
      : [];

    const originations = originationIds.length
      ? (
          await Promise.all(
            chunk(originationIds, ID_IN_CHUNK_SIZE).map(ids =>
              api.getOperationsOrigination(query["level.ge"] || 0, undefined, {
                "id.in": ids.join(","),
              }),
            ),
          )
        ).flat()
      : [];

    // Build id -> operation maps once so per-transfer lookups are O(1) instead of O(n).
    // Keys are widened to `number | undefined` so lookups with a missing id naturally
    // return `undefined` (no entry is ever stored under the `undefined` key).
    const transactionsById = new Map<number | undefined, (typeof transactions)[number]>(
      transactions.map(t => [t.id, t]),
    );
    const originationsById = new Map<number | undefined, (typeof originations)[number]>(
      originations.map(o => [o.id, o]),
    );

    return data.map(token => {
      const transaction = transactionsById.get(token.transactionId);
      const origination = originationsById.get(token.originationId);

      return {
        ...token,
        hash: transaction?.hash ?? origination?.hash ?? "",
        block: transaction?.block ?? origination?.block ?? "",
      };
    });
  },

  /**
   * Fetches FA2 token balances for a given account.
   * When `tokenFilter` is omitted, all FA2 token balances are returned.
   * Pass `tokenFilter` to query a specific FA2 contract + token id (e.g. send-max for FA2).
   * https://api.tzkt.io/#operation/Tokens_GetTokenBalances
   */
  async getTokensBalances(
    address: string,
    tokenFilter?: { contractAddress: string; tokenId: number },
  ): Promise<APITokenBalance[]> {
    const params: Record<string, unknown> = {
      account: address,
      "token.standard": "fa2",
    };
    if (tokenFilter) {
      params["token.contract"] = tokenFilter.contractAddress;
      params["token.tokenId"] = String(tokenFilter.tokenId);
    }
    const { data } = await network<APITokenBalance[]>({
      url: `${getExplorerUrl()}/v1/tokens/balances`,
      params,
    });
    return data;
  },
};

// TODO this has same purpose as api/listOperations
export const fetchAllTransactions = async (
  address: string,
  lastId?: number,
): Promise<APIOperation[]> => {
  let ops: APIOperation[] = [];
  let maxIteration = coinConfig.getCoinConfig().explorer.maxTxQuery;
  do {
    const newOps = await api.getAccountOperations(address, {
      lastId,
      sort: "Ascending",
      "level.ge": 0,
    });
    if (newOps.length === 0) return ops;
    ops = ops.concat(newOps);
    const last = ops[ops.length - 1];
    if (!last) return ops;
    lastId = last.id;
    if (!lastId) {
      log("tezos", "id missing!");
      return ops;
    }
  } while (--maxIteration);
  return ops;
};

/**
 * Generic paginated fetcher for block-level operations.
 *
 * TzKT hard-caps a single request at 10 000 items. This function issues multiple
 * requests when needed and is therefore safe for dense blocks.
 * A safety cap (`maxTxQuery`) prevents infinite loops on pathological responses.
 */
async function fetchBlockPaginated<T extends { id: number }>(
  pageFn: (level: number, cursor?: number) => Promise<T[]>,
  level: number,
  label: string,
): Promise<T[]> {
  const items: T[] = [];
  let cursor: number | undefined;
  let maxIteration = coinConfig.getCoinConfig().explorer.maxTxQuery;
  do {
    const page = await pageFn(level, cursor);
    if (page.length === 0) break;
    items.push(...page);
    if (page.length < BLOCK_PAGE_SIZE) break;
    cursor = page.at(-1)!.id;
  } while (--maxIteration > 0);
  if (maxIteration === 0) {
    log("tezos", `${label}: maxTxQuery limit reached at level ${level}, result may be incomplete`);
  }
  return items;
}

export const fetchBlockTransactions = (level: number) =>
  fetchBlockPaginated(api.getBlockTransactionsPage, level, "fetchBlockTransactions");

export const fetchBlockTokenTransfers = (level: number) =>
  fetchBlockPaginated(api.getBlockTokenTransfersPage, level, "fetchBlockTokenTransfers");

export const fetchBlockDelegations = (level: number) =>
  fetchBlockPaginated(api.getBlockDelegationsPage, level, "fetchBlockDelegations");

export const fetchBlockStaking = (level: number) =>
  fetchBlockPaginated(api.getBlockStakingPage, level, "fetchBlockStaking");

export const fetchBlockOriginations = (level: number) =>
  fetchBlockPaginated(api.getBlockOriginationsPage, level, "fetchBlockOriginations");

export const fetchBlockReveals = (level: number) =>
  fetchBlockPaginated(api.getBlockRevealsPage, level, "fetchBlockReveals");

export default api;
