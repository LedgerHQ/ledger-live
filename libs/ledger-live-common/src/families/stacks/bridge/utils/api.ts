import { AxiosRequestConfig, AxiosResponse } from "axios";

import {
  BalanceResponse,
  BroadcastTransactionRequest,
  BroadcastTransactionResponse,
  EstimatedFeesRequest,
  EstimatedFeesResponse,
  GetNonceResponse,
  MempoolResponse,
  MempoolTransaction,
  NetworkStatusResponse,
  TransactionResponse,
  TransactionsResponse,
} from "./api.types";
import network from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";

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

  return responseData;
};

export const fetchBalances = async (addr: string): Promise<BalanceResponse> => {
  const data = await fetch<BalanceResponse>(`/extended/v1/address/${addr}/stx`);
  return data; // TODO Validate if the response fits this interface
};

export const fetchEstimatedFees = async (
  request: EstimatedFeesRequest,
): Promise<EstimatedFeesResponse> => {
  const feeRate = await send<EstimatedFeesResponse>(`/v2/fees/transfer`, request);
  return feeRate; // TODO Validate if the response fits this interface
};

export const fetchBlockHeight = async (): Promise<NetworkStatusResponse> => {
  const data = await fetch<NetworkStatusResponse>("/extended");
  return data as NetworkStatusResponse; // TODO Validate if the response fits this interface
};

export const fetchTxs = async (addr: string, offset = 0): Promise<TransactionsResponse> => {
  const limit = 50;
  try {
    const response = await fetch<TransactionsResponse>(
      `/extended/v2/addresses/${addr}/transactions?offset=${offset}&limit=${limit}`,
    );
    return response; // TODO Validate if the response fits this interface
  } catch (e) {
    return { limit, offset, total: 0, results: [] };
  }
};

export const fetchFullTxs = async (addr: string): Promise<TransactionResponse[]> => {
  let qty,
    offset = 0;
  let txs: TransactionResponse[] = [];

  do {
    const { results, total, limit } = await fetchTxs(addr, offset);
    txs = txs.concat(
      results.filter(t => {
        if (t.tx?.tx_type === "token_transfer") {
          return true;
        }

        if (
          t.tx?.tx_type === "contract_call" &&
          t.tx?.contract_call?.function_name === "send-many"
        ) {
          return true;
        }

        return false;
      }),
    );

    offset += limit;
    qty = total;
  } while (offset < qty);

  return txs; // TODO Validate if the response fits this interface
};

export const broadcastTx = async (
  message: BroadcastTransactionRequest,
): Promise<BroadcastTransactionResponse> => {
  let response = await sendRaw<BroadcastTransactionResponse>(`/v2/transactions`, message);

  if (response != "") response = `0x${response}`;
  return response; // TODO Validate if the response fits this interface
};

export const fetchMempoolTxs = async (addr: string, offset = 0): Promise<MempoolResponse> => {
  const response = await fetch<MempoolResponse>(
    `/extended/v1/tx/mempool?sender_address=${addr}&offset=${offset}`,
  );
  return response; // TODO Validate if the response fits this interface
};

export const fetchFullMempoolTxs = async (addr: string): Promise<MempoolTransaction[]> => {
  let qty,
    offset = 0;
  let txs: MempoolTransaction[] = [];

  do {
    const { results, total, limit } = await fetchMempoolTxs(addr, offset);
    txs = txs.concat(results);

    offset += limit;
    qty = total;
  } while (offset < qty);

  return txs; // TODO Validate if the response fits this interface
};

export const fetchNonce = async (addr: string): Promise<GetNonceResponse> => {
  const response = await fetch<GetNonceResponse>(`/extended/v1/address/${addr}/nonces`);
  return response; // TODO Validate if the response fits this interface
};
