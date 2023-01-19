import { log } from "@ledgerhq/logs";
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
import { getNetwork } from "../../../../network";
import { getEnv } from "../../../../env";

const getFilecoinURL = (path?: string): string => {
  const baseUrl = getEnv("API_FILECOIN_ENDPOINT");
  if (!baseUrl) throw new Error("API base URL not available");

  return `${baseUrl}${path ? path : ""}`;
};

const fetch = async <T>(path: string): Promise<T> => {
  const url = getFilecoinURL(path);
  const response = await getNetwork().get(url).res();
  const data = await response.json();
  return data;
};

const send = async <T>(path: string, data: Record<string, any>): Promise<T> => {
  const url = getFilecoinURL(path);
  const response = await getNetwork()
    .headers({
      "Content-Type": "application/json",
    })
    .post(url, JSON.stringify(data))
    .res();
  const responseData = await response.json();
  return responseData;
};

export const fetchBalances = async (addr: string): Promise<BalanceResponse> => {
  const data = await fetch<BalanceResponse>(`/addresses/${addr}/balance`);
  return data; // TODO Validate if the response fits this interface
};

export const fetchEstimatedFees = async (
  request: EstimatedFeesRequest
): Promise<EstimatedFeesResponse> => {
  const data = await send<EstimatedFeesResponse>(`/fees/estimate`, request);
  return data; // TODO Validate if the response fits this interface
};

export const fetchBlockHeight = async (): Promise<NetworkStatusResponse> => {
  const data = await fetch<NetworkStatusResponse>("/network/status");
  return data as NetworkStatusResponse; // TODO Validate if the response fits this interface
};

export const fetchTxs = async (
  addr: string
): Promise<TransactionResponse[]> => {
  const response = await fetch<TransactionsResponse>(
    `/addresses/${addr}/transactions`
  );
  return response.txs; // TODO Validate if the response fits this interface
};

export const broadcastTx = async (
  message: BroadcastTransactionRequest
): Promise<BroadcastTransactionResponse> => {
  const response = await send<BroadcastTransactionResponse>(
    `/transaction/broadcast`,
    message
  );
  return response; // TODO Validate if the response fits this interface
};
