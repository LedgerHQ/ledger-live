import { log } from "@ledgerhq/logs";
import { AxiosRequestConfig, AxiosResponse } from "axios";

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
import network from "../../../../network";
import { getEnv } from "../../../../env";

const getStacksURL = (path?: string): string => {
  const baseUrl = getEnv("API_STACKS_ENDPOINT");
  if (!baseUrl) throw new Error("API base URL not available");

  return `${baseUrl}${path ? path : ""}`;
};

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

  log("http", url);
  return data;
};

const send = async <T>(path: string, data: Record<string, any>) => {
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

  log("http", url);
  return responseData;
};

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

  log("http", url);
  return responseData;
};

export const fetchBalances = async (addr: string): Promise<BalanceResponse> => {
  const data = await fetch<BalanceResponse>(`/extended/v1/address/${addr}/stx`);
  return data; // TODO Validate if the response fits this interface
};

export const fetchEstimatedFees = async (
  request: EstimatedFeesRequest
): Promise<EstimatedFeesResponse> => {
  const feeRate = await send<EstimatedFeesResponse>(
    `/v2/fees/transfer`,
    request
  );
  return feeRate; // TODO Validate if the response fits this interface
};

export const fetchBlockHeight = async (): Promise<NetworkStatusResponse> => {
  const data = await fetch<NetworkStatusResponse>("/extended/v1/status");
  return data as NetworkStatusResponse; // TODO Validate if the response fits this interface
};

export const fetchTxs = async (
  addr: string
): Promise<TransactionResponse[]> => {
  const response = await fetch<TransactionsResponse>(
    `/extended/v1/address/${addr}/transactions_with_transfers`
  );
  return response.results; // TODO Validate if the response fits this interface
};

export const broadcastTx = async (
  message: BroadcastTransactionRequest
): Promise<BroadcastTransactionResponse> => {
  let response = await sendRaw<BroadcastTransactionResponse>(
    `/v2/transactions`,
    message
  );

  if (response != "") response = `0x${response}`;
  return response; // TODO Validate if the response fits this interface
};
