import URL from "url";
import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import coinConfig from "../config";
import {
  APIAccount,
  APIBlock,
  APIDelegationType,
  APIOperation,
  APITokenTransfer,
  APITransactionType,
  AccountsGetOperationsOptions,
  TokenTransfersGetOptions,
  APITokenBalance,
} from "./types";

/** TzKT hard-caps `limit` at 10 000; we use a safer page size to stay well under that. */
const BLOCK_PAGE_SIZE = 1000;

const getExplorerUrl = () => coinConfig.getCoinConfig().explorer.url;

const clearUndefined = (obj: Record<string, unknown>) => {
  const newObj = { ...obj };
  Object.entries(newObj).forEach(([key, value]) => value === undefined && delete newObj[key]);

  return newObj;
};

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
  ): Promise<APITransactionType[]> {
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
    const { data } = await network<APITransactionType[]>({
      url: `${getExplorerUrl()}/v1/operations/transactions`,
      params,
    });
    return data;
  },

  /**
   * Fetches a single page of FA token transfers at the given block level.
   * Internal — used by `fetchBlockTokenTransfers` which handles pagination.
   * https://api.tzkt.io/#operation/Tokens_GetTokenTransfers
   */
  async getBlockTokenTransfersPage(level: number, cursor?: number): Promise<APITokenTransfer[]> {
    // Same rationale as getBlockTransactionsPage: explicit ascending sort keeps the
    // offset.cr cursor advancing forward regardless of the API's default ordering.
    const params: Record<string, unknown> = { level, limit: BLOCK_PAGE_SIZE, "sort.asc": "id" };
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
    level: number,
    cursor?: number,
    apiQueryParams: Record<string, unknown> = {},
  ): Promise<APITokenTransfer[]> {
    // Same rationale as getBlockTransactionsPage: explicit ascending sort keeps the
    // offset.cr cursor advancing forward regardless of the API's default ordering.;
    const params: Record<string, unknown> = {
      "level.gte": level,
      limit: BLOCK_PAGE_SIZE,
      "sort.asc": "id",
      ...clearUndefined(apiQueryParams),
    };
    if (cursor !== undefined) params["offset.cr"] = cursor;
    const { data } = await network<APITokenTransfer[]>({
      url: `${getExplorerUrl()}/v1/tokens/transfers`,
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
   * Fetches FA2 token transfers (tokenId = 0 only) for a given account.
   * This is limited to `token.standard=fa2` and `token.tokenId=0` on the TzKT API.
   * https://api.tzkt.io/#operation/Tokens_GetTokenTransfers
   */
  async getAccountTokenTransfers(
    address: string,
    query: TokenTransfersGetOptions,
  ): Promise<(APITokenTransfer & { hash: string })[]> {
    const params: Record<string, unknown> = {
      "anyof.from.to": address,
      "token.tokenId": "0",
      "token.standard": "fa2",
    };

    const data = await api.getTokenTransfers(query["level.ge"] as number, query["lastId"], params);

    const transactionIds = data
      .map(t => t.transactionId)
      .filter((id): id is number => typeof id === "number");

    if (transactionIds.length === 0) {
      return data.map(token => ({
        ...token,
        hash: "",
      }));
    }

    const transactions = await api.getOperationsTransactions(query["level.ge"] || 0, undefined, {
      "id.in": transactionIds.join(","),
    });

    return data.map(token => ({
      ...token,
      hash: transactions.find(t => t.id === token.transactionId)?.hash ?? "",
    }));
  },

  /**
   * Fetches FA token balances for a given account.
   * When `tokenFilter` is omitted, only FA2 tokenId 0 balances are returned (legacy behaviour).
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
    } else {
      params["token.tokenId"] = "0";
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
 * Fetches ALL `transaction` operations for a given block level, paginating through
 * TzKT's cursor-based pages (`offset.cr`) until exhausted.
 *
 * TzKT hard-caps a single request at 10 000 items. This function issues multiple
 * requests when needed and is therefore safe for dense blocks.
 * A safety cap (`maxTxQuery`) prevents infinite loops on pathological responses.
 */
export const fetchBlockTransactions = async (level: number): Promise<APITransactionType[]> => {
  const txs: APITransactionType[] = [];
  let cursor: number | undefined;
  let maxIteration = coinConfig.getCoinConfig().explorer.maxTxQuery;
  do {
    const page = await api.getBlockTransactionsPage(level, cursor);
    if (page.length === 0) break;
    txs.push(...page);
    if (page.length < BLOCK_PAGE_SIZE) break; // last page: no need for another round-trip
    cursor = page.at(-1)!.id;
  } while (--maxIteration > 0);
  if (maxIteration === 0) {
    log(
      "tezos",
      `fetchBlockTransactions: maxTxQuery limit reached at level ${level}, result may be incomplete`,
    );
  }
  return txs;
};

/**
 * Fetches ALL FA token transfers for a given block level, paginating through
 * TzKT's cursor-based pages (`offset.cr`) until exhausted.
 *
 * TzKT hard-caps a single request at 10 000 items. This function issues multiple
 * requests when needed and is therefore safe for airdrop / DeFi-heavy blocks.
 * A safety cap (`maxTxQuery`) prevents infinite loops on pathological responses.
 */
export const fetchBlockTokenTransfers = async (level: number): Promise<APITokenTransfer[]> => {
  const transfers: APITokenTransfer[] = [];
  let cursor: number | undefined;
  let maxIteration = coinConfig.getCoinConfig().explorer.maxTxQuery;
  do {
    const page = await api.getBlockTokenTransfersPage(level, cursor);
    if (page.length === 0) break;
    transfers.push(...page);
    if (page.length < BLOCK_PAGE_SIZE) break; // last page
    cursor = page.at(-1)!.id;
  } while (--maxIteration > 0);
  if (maxIteration === 0) {
    log(
      "tezos",
      `fetchBlockTokenTransfers: maxTxQuery limit reached at level ${level}, result may be incomplete`,
    );
  }
  return transfers;
};

/**
 * Fetches ALL `delegation` operations for a given block level, paginating through
 * TzKT's cursor-based pages (`offset.cr`) until exhausted.
 */
export const fetchBlockDelegations = async (level: number): Promise<APIDelegationType[]> => {
  const delegations: APIDelegationType[] = [];
  let cursor: number | undefined;
  let maxIteration = coinConfig.getCoinConfig().explorer.maxTxQuery;
  do {
    const page = await api.getBlockDelegationsPage(level, cursor);
    if (page.length === 0) break;
    delegations.push(...page);
    if (page.length < BLOCK_PAGE_SIZE) break;
    cursor = page.at(-1)!.id;
  } while (--maxIteration > 0);
  if (maxIteration === 0) {
    log(
      "tezos",
      `fetchBlockDelegations: maxTxQuery limit reached at level ${level}, result may be incomplete`,
    );
  }
  return delegations;
};

export default api;
