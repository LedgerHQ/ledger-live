import { log } from "@ledgerhq/logs";

import network from "@ledgerhq/live-network";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { getEnv } from "@ledgerhq/live-env";

import {
  BalanceResponse,
  BroadcastTransactionRequest,
  BroadcastTransactionResponse,
  EstimatedFeesRequest,
  EstimatedFeesResponse,
  NetworkStatusResponse,
  TransactionResponse,
  TransactionsResponse,
  FetchERC20TransactionsResponse,
  ERC20Transfer,
  ERC20BalanceResponse,
} from "../types";
import { FilecoinFeeEstimationFailed } from "../errors";
import { LiveNetworkRequest } from "@ledgerhq/live-network/network";

const txsPerPageLimit = 1000;
const currentVersion = "/v2";
const fromHeightQueryParam = "from_height";

const getFilecoinURL = (version?: string, path?: string): string => {
  const baseUrl = getEnv("API_FILECOIN_ENDPOINT");
  if (!baseUrl) throw new Error("API base URL not available");

  return `${baseUrl}${version ? version : ""}${path ? path : ""}`;
};

const fetch = async <T>(version: string, path: string) => {
  const url = getFilecoinURL(version, path);

  // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
  const opts: LiveNetworkRequest<undefined> = {
    method: "GET",
    url,
  };

  const rawResponse = await network<T>(opts);

  // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
  const { data } = rawResponse;

  log("http", url);
  return data;
};

type sendDataType = EstimatedFeesRequest | BroadcastTransactionRequest;
const send = async <T>(version: string, path: string, data: sendDataType) => {
  const url = getFilecoinURL(version, path);

  const opts: LiveNetworkRequest<string> = {
    method: "POST",
    url,
    data: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  };

  const rawResponse = await network<T>(opts);

  // We force data to this way as network func is not using generics. Changing that func will generate errors in other implementations
  const { data: responseData } = rawResponse;

  log("http", url);
  return responseData;
};

export const fetchBalances = async (addr: string): Promise<BalanceResponse> => {
  const data = await fetch<BalanceResponse>(currentVersion, `/addresses/${addr}/balance`);
  return data; // TODO Validate if the response fits this interface
};

export const fetchEstimatedFees = makeLRUCache(
  async (request: EstimatedFeesRequest): Promise<EstimatedFeesResponse> => {
    try {
      const data = await send<EstimatedFeesResponse>(currentVersion, `/fees/estimate`, request);
      return data; // TODO Validate if the response fits this interface
    } catch (e) {
      log("error", "filecoin fetchEstimatedFees", e);
      throw new FilecoinFeeEstimationFailed();
    }
  },
  request => `${request.from}-${request.to}`,
  {
    ttl: 5 * 1000, // 5 seconds
  },
);

export const fetchBlockHeight = async (): Promise<NetworkStatusResponse> => {
  const data = await fetch<NetworkStatusResponse>(currentVersion, "/network/status");
  return data; // TODO Validate if the response fits this interface
};

export const fetchTxs = async (
  addr: string,
  lastHeight: number,
  offset: number,
  limit: number,
): Promise<TransactionsResponse> => {
  const response = await fetch<TransactionsResponse>(
    currentVersion,
    `/addresses/${addr}/transactions?${fromHeightQueryParam}=${lastHeight}&offset=${offset}&limit=${limit}`,
  );
  return response; // TODO Validate if the response fits this interface
};

export const fetchTxsWithPages = async (
  addr: string,
  lastHeight: number,
): Promise<TransactionResponse[]> => {
  let result: TransactionResponse[] = [];
  let offset = 0;
  let txsLen = txsPerPageLimit;

  while (txsLen === txsPerPageLimit) {
    const { txs } = await fetchTxs(addr, lastHeight, offset, txsPerPageLimit);
    result = result.concat(txs);

    txsLen = txs.length;
    offset += txsLen;
  }

  return result;
};

export const broadcastTx = async (
  message: BroadcastTransactionRequest,
): Promise<BroadcastTransactionResponse> => {
  const response = await send<BroadcastTransactionResponse>(
    currentVersion,
    `/transaction/broadcast`,
    message,
  );
  return response; // TODO Validate if the response fits this interface
};

export const fetchERC20TokenBalance = async (
  ethAddr: string,
  contractAddr: string,
): Promise<string> => {
  const res = await fetch<ERC20BalanceResponse>(
    currentVersion,
    `/contract/${contractAddr}/address/${ethAddr}/balance/erc20`,
  );

  if (res.data.length) {
    return res.data[0].balance;
  }

  return "0";
};

export const fetchERC20Transactions = async (
  ethAddr: string,
  lastHeight: number,
  offset: number,
  limit: number,
): Promise<FetchERC20TransactionsResponse> => {
  const res = await fetch<FetchERC20TransactionsResponse>(
    currentVersion,
    `/addresses/${ethAddr}/transactions/erc20?${fromHeightQueryParam}=${lastHeight}&offset=${offset}&limit=${limit}`,
  );
  return res;
};

export const fetchERC20TransactionsWithPages = async (
  addr: string,
  lastHeight: number,
): Promise<ERC20Transfer[]> => {
  let result: ERC20Transfer[] = [];
  let offset = 0;
  let txsLen = txsPerPageLimit;

  while (txsLen === txsPerPageLimit) {
    const { txs } = await fetchERC20Transactions(addr, lastHeight, offset, txsPerPageLimit);
    result = result.concat(txs);

    txsLen = txs.length;
    offset += txsLen;
  }

  return result.sort((a, b) => b.timestamp - a.timestamp);
};
