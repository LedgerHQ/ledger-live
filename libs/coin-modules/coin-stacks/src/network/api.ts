import { AxiosRequestConfig, AxiosResponse } from "axios";

import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
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
import {
  extractTokenTransferTransactions,
  extractSendManyTransactions,
  extractContractTransactions,
} from "./transformers";
import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import { StacksMainnet, StacksTestnet } from "@stacks/network";

export const StacksNetwork = {
  mainnet: new StacksMainnet({ url: getEnv("API_STACKS_ENDPOINT") }),
  testnet: new StacksTestnet(),
};

/**
 * Builds the Stacks API URL with an optional path
 */
const getStacksURL = (path?: string): string => {
  const baseUrl = getEnv("API_STACKS_ENDPOINT");
  if (!baseUrl) throw new Error("API base URL not available");

  return `${baseUrl}${path ? path : ""}`;
};

/**
 * Basic GET request to the Stacks API
 */
const fetch = async <T>(path: string) => {
  const url = getStacksURL(path);

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
const send = async <T>(path: string, data: Record<string, unknown>) => {
  const url = getStacksURL(path);

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
const sendRaw = async <T>(path: string, data: Buffer) => {
  const url = getStacksURL(path);

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
export const fetchBalances = async (addr: string): Promise<BalanceResponse> => {
  const data = await fetch<BalanceResponse>(`/extended/v1/address/${addr}/stx`);
  return data;
};

/**
 * Fetches a page of token balances for an address
 */
export const fetchTokenBalancesPage = async (
  addr: string,
  offset = 0,
  limit = 50,
): Promise<TokenBalanceResponse> => {
  try {
    const response = await fetch<TokenBalanceResponse>(
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
export const fetchAllTokenBalances = async (addr: string): Promise<Record<string, string>> => {
  const limit = 50;
  let offset = 0;
  let total = 0;
  const tokenBalanceMap: Record<string, string> = {};

  do {
    const response = await fetchTokenBalancesPage(addr, offset, limit);
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
export const fetchEstimatedFees = async (request: EstimatedFeesRequest): Promise<number> => {
  // Cast to Record<string, unknown> to satisfy type constraints
  const feeRate = await send<number>(
    `/v2/fees/transfer`,
    request as unknown as Record<string, unknown>,
  );
  return feeRate;
};

/**
 * Fetches current blockchain status, including block height
 */
export const fetchBlockHeight = async (): Promise<NetworkStatusResponse> => {
  const data = await fetch<NetworkStatusResponse>("/extended");
  return data;
};

/**
 * Fetches a page of transactions for an address
 */
export const fetchTransactionsPage = async (
  addr: string,
  offset = 0,
  limit = 50,
): Promise<TransactionsResponse> => {
  try {
    const response = await fetch<TransactionsResponse>(
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
export const fetchAllTransactions = async (addr: string): Promise<TransactionResponse[]> => {
  let qty;
  let offset = 0;
  const limit = 50;
  const allTransactions: TransactionResponse[] = [];

  // Fetch all transactions in pages
  do {
    const { results, total } = await fetchTransactionsPage(addr, offset, limit);
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
  addr: string,
): Promise<[TransactionResponse[], Record<string, TransactionResponse[]>]> => {
  // 1. Fetch all transactions
  const allTransactions = await fetchAllTransactions(addr);

  // 2. Extract regular token transfers
  const tokenTransfers = extractTokenTransferTransactions(allTransactions);
  // 3. Extract and group contract calls
  const contractTransactions = await extractContractTransactions(allTransactions);

  // 4. Add send-many transactions to token transfers
  const sendManyTransactions = extractSendManyTransactions(allTransactions);
  tokenTransfers.push(...sendManyTransactions);

  return [tokenTransfers, contractTransactions];
};

/**
 * Broadcasts a signed transaction to the Stacks network
 */
export const broadcastTx = async (message: BroadcastTransactionRequest): Promise<string> => {
  let response = await sendRaw<string>(`/v2/transactions`, message);

  if (response !== "") response = `0x${response}`;
  return response;
};

/**
 * Fetches a page of mempool transactions for an address
 */
export const fetchMempoolTransactionsPage = async (
  addr: string,
  offset = 0,
  limit = 50,
): Promise<MempoolResponse> => {
  const response = await fetch<MempoolResponse>(
    `/extended/v1/tx/mempool?sender_address=${addr}&offset=${offset}&limit=${limit}`,
  );
  return response;
};

/**
 * Fetches all mempool transactions for an address
 */
export const fetchFullMempoolTxs = async (addr: string): Promise<MempoolTransaction[]> => {
  let qty;
  let offset = 0;
  const limit = 50;
  let txs: MempoolTransaction[] = [];

  do {
    const { results, total } = await fetchMempoolTransactionsPage(addr, offset, limit);
    txs = txs.concat(results);

    offset += limit;
    qty = total;
  } while (offset < qty);

  return txs;
};

/**
 * Fetches the nonce for an address
 */
export const fetchNonce = async (addr: string): Promise<GetNonceResponse> => {
  const response = await fetch<GetNonceResponse>(`/extended/v1/address/${addr}/nonces`);
  return response;
};

/**
 * Fetches metadata for a fungible token by contract address
 * This can be used to extract the asset_identifier from a contract_id
 * @param contractAddress - The contract address in format: ADDRESS.CONTRACT_NAME
 * @returns The fungible token metadata including asset_identifier
 */
export const fetchFungibleTokenMetadata = async (
  contractAddress: string,
): Promise<FungibleTokenMetadataResponse> => {
  const url = `/metadata/v1/ft?address=${contractAddress}`;
  const response = await fetch<FungibleTokenMetadataResponse>(url);
  return response;
};

/**
 * Fetches metadata for a fungible token by contract address with caching
 */
export const fetchFungibleTokenMetadataCached = makeLRUCache(
  fetchFungibleTokenMetadata,
  args => args,
  minutes(60),
);
