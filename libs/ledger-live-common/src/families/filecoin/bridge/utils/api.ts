import { log } from "@ledgerhq/logs";
import { AxiosRequestConfig, AxiosResponse } from "axios";

import network from "@ledgerhq/live-network/network";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { getEnv } from "../../../../env";
import {
  BalanceResponse,
  BroadcastTransactionRequest,
  BroadcastTransactionResponse,
  EstimatedFeesRequest,
  EstimatedFeesResponse,
  NetworkStatusResponse,
  TransactionResponse,
  TransactionsResponse,
} from "./types";

const getFilecoinURL = (path?: string): string => {
  const baseUrl = getEnv("API_FILECOIN_ENDPOINT");
  if (!baseUrl) throw new Error("API base URL not available");

  return `${baseUrl}${path ? path : ""}`;
};

const fetch = async <T>(path: string) => {
  const url = getFilecoinURL(path);

  // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
  const opts: AxiosRequestConfig = {
    method: "GET",
    url,
  };
  const rawResponse = await network(opts);

  // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
  const { data } = rawResponse as AxiosResponse<T>;

  log("http", url);
  return data;
};

const send = async <T>(path: string, data: Record<string, any>) => {
  const url = getFilecoinURL(path);

  const opts: AxiosRequestConfig = {
    method: "POST",
    url,
    data: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  };

  const rawResponse = await network(opts);

  // We force data to this way as network func is not using generics. Changing that func will generate errors in other implementations
  const { data: responseData } = rawResponse as AxiosResponse<T>;

  log("http", url);
  return responseData;
};

export const fetchBalances = async (addr: string): Promise<BalanceResponse> => {
  const data = await fetch<BalanceResponse>(`/addresses/${addr}/balance`);
  return data; // TODO Validate if the response fits this interface
};

export const fetchEstimatedFees = makeLRUCache(
  async (request: EstimatedFeesRequest): Promise<EstimatedFeesResponse> => {
    const data = await send<EstimatedFeesResponse>(`/fees/estimate`, request);
    return data; // TODO Validate if the response fits this interface
  },
  request => `${request.from}-${request.to}`,
  {
    ttl: 5 * 1000, // 5 seconds
  },
);

export const fetchBlockHeight = async (): Promise<NetworkStatusResponse> => {
  const data = await fetch<NetworkStatusResponse>("/network/status");
  return data as NetworkStatusResponse; // TODO Validate if the response fits this interface
};

export const fetchTxs = async (addr: string): Promise<TransactionResponse[]> => {
  const response = await fetch<TransactionsResponse>(`/addresses/${addr}/transactions`);
  return response.txs; // TODO Validate if the response fits this interface
};

export const broadcastTx = async (
  message: BroadcastTransactionRequest,
): Promise<BroadcastTransactionResponse> => {
  const response = await send<BroadcastTransactionResponse>(`/transaction/broadcast`, message);
  return response; // TODO Validate if the response fits this interface
};
