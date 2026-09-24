import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  BalanceResponse,
  BroadcastTransactionRequest,
  EstimatedFeesRequest,
  FungibleTokenMetadataResponse,
  GetNonceResponse,
  MempoolResponse,
  MempoolTransaction,
  NetworkStatusResponse,
  TokenBalanceResponse,
  TransactionResponse,
  TransactionsResponse,
} from "../types/api";
import type { StacksCurrencyConfig } from "../config";
import {
  extractTokenTransferTransactions,
  extractSendManyTransactions,
  extractContractTransactions,
} from "./transformers";

// Only used as a `keyof typeof StacksNetwork` type and an existence check on the network name --
// never dereferenced for a value -- so plain string constants avoid needing v6's now-removed
// StacksMainnet/StacksTestnet classes (v7 replaced them with a string-based network name).
export const StacksNetwork = {
  mainnet: "mainnet",
  testnet: "testnet",
  // Additive only: lets the legacy bridge's `network: keyof typeof StacksNetwork` field
  // (`types/bridge.ts`) address a local devnet (e.g. Clarinet), same env var as `mainnet`.
  devnet: "devnet",
} as const;

/**
 * The Stacks API base URL from the coin config, or throws if unset. Shared by every network helper
 * that needs the raw base URL rather than a full path (e.g. the @stacks/transactions SDK's own
 * `client.baseUrl` option), so a missing endpoint fails the same way everywhere in this module.
 */
export const getStacksBaseUrl = (config: StacksCurrencyConfig): string => {
  const baseUrl = config.infra.API_STACKS_ENDPOINT;
  if (!baseUrl) throw new Error("API base URL not available");

  return baseUrl;
};

/**
 * Builds the Stacks API URL with an optional path
 */
const getStacksURL = (config: StacksCurrencyConfig, path?: string): string =>
  `${getStacksBaseUrl(config)}${path ?? ""}`;

/**
 * Basic GET request to the Stacks API
 */
const fetch = async <T>(config: StacksCurrencyConfig, path: string) => {
  const url = getStacksURL(config, path);

  // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
  const opts: AxiosRequestConfig = {
    method: "GET",
    url,
  };
  const rawResponse = await network(opts);

  // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
  const { data } = rawResponse as AxiosResponse<T>;

  return data;
};

/**
 * Basic POST request with JSON data to the Stacks API
 */
const send = async <T>(
  config: StacksCurrencyConfig,
  path: string,
  data: Record<string, unknown>,
) => {
  const url = getStacksURL(config, path);

  const opts: AxiosRequestConfig = {
    method: "POST",
    url,
    data: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  };

  const rawResponse = await network(opts);

  // We force data to this way as network func is not using generics. Changing that func will generate errors in other implementations
  const { data: responseData } = rawResponse as AxiosResponse<T>;

  return responseData;
};

/**
 * Basic POST request with raw binary data to the Stacks API
 */
const sendRaw = async <T>(config: StacksCurrencyConfig, path: string, data: Buffer) => {
  const url = getStacksURL(config, path);

  const opts: AxiosRequestConfig = {
    method: "POST",
    url,
    data,
    headers: { "Content-Type": "application/octet-stream" },
  };

  const rawResponse = await network(opts);

  // We force data to this way as network func is not using generics. Changing that func will generate errors in other implementations
  const { data: responseData } = rawResponse as AxiosResponse<T>;

  return responseData;
};

/**
 * Fetches STX balance for an address
 */
export const fetchBalances = async (
  config: StacksCurrencyConfig,
  addr: string,
): Promise<BalanceResponse> => {
  const data = await fetch<BalanceResponse>(config, `/extended/v2/addresses/${addr}/balances/stx`);
  return data;
};

/**
 * Fetches a page of token balances for an address
 */
export const fetchTokenBalancesPage = async (
  config: StacksCurrencyConfig,
  addr: string,
  offset = 0,
  limit = 50,
): Promise<TokenBalanceResponse> => {
  try {
    const response = await fetch<TokenBalanceResponse>(
      config,
      `/extended/v2/addresses/${addr}/balances/ft?offset=${offset}&limit=${limit}`,
    );
    return response;
  } catch {
    return { limit, offset, total: 0, results: [] };
  }
};

/**
 * Fetches all token balances for an address by paginating through results
 */
export const fetchAllTokenBalances = async (
  config: StacksCurrencyConfig,
  addr: string,
): Promise<Record<string, string>> => {
  const limit = 50;
  let offset = 0;
  let total = 0;
  const tokenBalanceMap: Record<string, string> = {};

  do {
    const response = await fetchTokenBalancesPage(config, addr, offset, limit);
    // Map token balances to a more convenient format
    for (const item of response.results) {
      tokenBalanceMap[item.token.toLowerCase()] = item.balance;
    }

    offset += limit;
    total = response.total;
  } while (offset < total);

  return tokenBalanceMap;
};

/**
 * Fetches estimated fees for a transfer
 */
export const fetchEstimatedFees = async (
  config: StacksCurrencyConfig,
  request: EstimatedFeesRequest,
): Promise<number> => {
  // Cast to Record<string, unknown> to satisfy type constraints
  const feeRate = await send<number>(
    config,
    `/v2/fees/transfer`,
    request as unknown as Record<string, unknown>,
  );
  return feeRate;
};

/**
 * Fetches current blockchain status, including block height
 */
export const fetchBlockHeight = async (
  config: StacksCurrencyConfig,
): Promise<NetworkStatusResponse> => {
  const data = await fetch<NetworkStatusResponse>(config, "/extended");
  return data;
};

/**
 * Fetches a page of transactions for an address
 */
export const fetchTransactionsPage = async (
  config: StacksCurrencyConfig,
  addr: string,
  offset = 0,
  limit = 50,
): Promise<TransactionsResponse> => {
  try {
    const response = await fetch<TransactionsResponse>(
      config,
      `/extended/v2/addresses/${addr}/transactions?offset=${offset}&limit=${limit}`,
    );
    return response;
  } catch {
    return { limit, offset, total: 0, results: [] };
  }
};

/**
 * Fetches all transactions for an address
 */
export const fetchAllTransactions = async (
  config: StacksCurrencyConfig,
  addr: string,
): Promise<TransactionResponse[]> => {
  let qty;
  let offset = 0;
  const limit = 50;
  const allTransactions: TransactionResponse[] = [];

  // Fetch all transactions in pages
  do {
    const { results, total } = await fetchTransactionsPage(config, addr, offset, limit);
    allTransactions.push(...results);
    offset += limit;
    qty = total;
  } while (offset < qty);

  return allTransactions;
};

/**
 * Fetches all transactions for an address and organizes them by type
 */
export const fetchFullTxs = async (
  config: StacksCurrencyConfig,
  addr: string,
): Promise<[TransactionResponse[], Record<string, TransactionResponse[]>]> => {
  // 1. Fetch all transactions
  const allTransactions = await fetchAllTransactions(config, addr);

  // 2. Extract regular token transfers
  const tokenTransfers = extractTokenTransferTransactions(allTransactions);
  // 3. Extract and group contract calls
  const contractTransactions = await extractContractTransactions(allTransactions, contractAddress =>
    fetchFungibleTokenMetadataCached(config, contractAddress),
  );

  // 4. Add send-many transactions to token transfers
  const sendManyTransactions = extractSendManyTransactions(allTransactions);
  tokenTransfers.push(...sendManyTransactions);

  return [tokenTransfers, contractTransactions];
};

/**
 * Broadcasts a signed transaction to the Stacks network
 */
export const broadcastTx = async (
  config: StacksCurrencyConfig,
  message: BroadcastTransactionRequest,
): Promise<string> => {
  let response = await sendRaw<string>(config, `/v2/transactions`, message);

  if (response !== "") response = `0x${response}`;
  return response;
};

/**
 * Fetches a page of mempool transactions for an address
 */
export const fetchMempoolTransactionsPage = async (
  config: StacksCurrencyConfig,
  addr: string,
  offset = 0,
  limit = 50,
): Promise<MempoolResponse> => {
  const response = await fetch<MempoolResponse>(
    config,
    `/extended/v1/tx/mempool?sender_address=${addr}&offset=${offset}&limit=${limit}`,
  );
  return response;
};

/**
 * Fetches all mempool transactions for an address
 */
export const fetchFullMempoolTxs = async (
  config: StacksCurrencyConfig,
  addr: string,
): Promise<MempoolTransaction[]> => {
  let qty;
  let offset = 0;
  const limit = 50;
  let txs: MempoolTransaction[] = [];

  do {
    const { results, total } = await fetchMempoolTransactionsPage(config, addr, offset, limit);
    txs = txs.concat(results);

    offset += limit;
    qty = total;
  } while (offset < qty);

  return txs;
};

/**
 * Fetches the nonce for an address
 */
export const fetchNonce = async (
  config: StacksCurrencyConfig,
  addr: string,
): Promise<GetNonceResponse> => {
  const response = await fetch<GetNonceResponse>(config, `/extended/v1/address/${addr}/nonces`);
  return response;
};

/**
 * Fetches metadata for a fungible token by contract address
 * This can be used to extract the asset_identifier from a contract_id
 * @param contractAddress - The contract address in format: ADDRESS.CONTRACT_NAME
 * @returns The fungible token metadata including asset_identifier
 */
export const fetchFungibleTokenMetadata = async (
  config: StacksCurrencyConfig,
  contractAddress: string,
): Promise<FungibleTokenMetadataResponse> => {
  const url = `/metadata/v1/ft?address=${contractAddress}`;
  const response = await fetch<FungibleTokenMetadataResponse>(config, url);
  return response;
};

/**
 * Fetches metadata for a fungible token by contract address with caching
 */
export const fetchFungibleTokenMetadataCached = makeLRUCache(
  fetchFungibleTokenMetadata,
  (_config, contractAddress) => contractAddress,
  minutes(60),
);
