import network from "@ledgerhq/live-network";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { LiveNetworkRequest } from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";

import type { FilecoinCoinConfig } from "../config";
import { FilecoinFeeEstimationFailed } from "../errors";
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

const txsPerPageLimit = 1000;
const currentVersion = "/v2";
const fromHeightQueryParam = "from_height";

const getFilecoinURL = (
  config: FilecoinCoinConfig,
  version: string = currentVersion,
  path?: string,
): string => {
  const baseUrl = config.infra.API_FILECOIN_ENDPOINT;
  if (!baseUrl) throw new Error("API base URL not available");

  return `${baseUrl}${version ? version : ""}${path ? path : ""}`;
};

type FetchProps = {
  version?: string;
};
const fetch = async <T>(config: FilecoinCoinConfig, path: string, { version }: FetchProps) => {
  const url = getFilecoinURL(config, version, path);

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
type sendProps = {
  version?: string;
  data: sendDataType;
};
const send = async <T>(
  config: FilecoinCoinConfig,
  path: string,
  { version, data }: sendProps,
): Promise<T> => {
  const url = getFilecoinURL(config, version, path);

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

export const fetchBalances = async (
  config: FilecoinCoinConfig,
  addr: string,
): Promise<BalanceResponse> => {
  const data = await fetch<BalanceResponse>(config, `/addresses/${addr}/balance`, {
    version: currentVersion,
  });
  return data; // TODO Validate if the response fits this interface
};

export const fetchEstimatedFees = makeLRUCache(
  async (
    config: FilecoinCoinConfig,
    request: EstimatedFeesRequest,
  ): Promise<EstimatedFeesResponse> => {
    try {
      const data = await send<EstimatedFeesResponse>(config, `/fees/estimate`, {
        version: currentVersion,
        data: request,
      });
      return data; // TODO Validate if the response fits this interface
    } catch (e) {
      log("error", "filecoin fetchEstimatedFees", e);
      throw new FilecoinFeeEstimationFailed();
    }
  },
  (_config, request) => `${request.from}-${request.to}`,
  {
    ttl: 5 * 1000, // 5 seconds
  },
);

export const fetchBlockHeight = async (
  config: FilecoinCoinConfig,
): Promise<NetworkStatusResponse> => {
  const data = await fetch<NetworkStatusResponse>(config, "/network/status", {
    version: currentVersion,
  });
  return data; // TODO Validate if the response fits this interface
};

export const fetchTxs = async (
  config: FilecoinCoinConfig,
  addr: string,
  lastHeight: number,
  offset: number = 0,
  limit: number = 0,
): Promise<TransactionsResponse> => {
  const response = await fetch<TransactionsResponse>(
    config,
    `/addresses/${addr}/transactions?${fromHeightQueryParam}=${lastHeight}&offset=${offset}&limit=${limit}`,
    {
      version: currentVersion,
    },
  );
  return response; // TODO Validate if the response fits this interface
};

export const fetchTxsWithPages = async (
  config: FilecoinCoinConfig,
  addr: string,
  lastHeight: number,
): Promise<TransactionResponse[]> => {
  let result: TransactionResponse[] = [];
  let offset = 0;
  let txsLen = txsPerPageLimit;

  while (txsLen === txsPerPageLimit) {
    const { txs } = await fetchTxs(config, addr, lastHeight, offset, txsPerPageLimit);
    result = result.concat(txs);

    txsLen = txs.length;
    offset += txsLen;
  }

  return result;
};

export const broadcastTx = async (
  config: FilecoinCoinConfig,
  message: BroadcastTransactionRequest,
): Promise<BroadcastTransactionResponse> => {
  const response = await send<BroadcastTransactionResponse>(config, `/transaction/broadcast`, {
    version: currentVersion,
    data: message,
  });
  return response; // TODO Validate if the response fits this interface
};

export const fetchERC20TokenBalance = async (
  config: FilecoinCoinConfig,
  ethAddr: string,
  contractAddr: string,
): Promise<string> => {
  const res = await fetch<ERC20BalanceResponse>(
    config,
    `/contract/${contractAddr}/address/${ethAddr}/balance/erc20`,
    {
      version: currentVersion,
    },
  );

  if (res.data.length) {
    return res.data[0].balance;
  }

  return "0";
};

export const fetchERC20Transactions = async (
  config: FilecoinCoinConfig,
  ethAddr: string,
  lastHeight: number,
  offset: number = 0,
  limit: number = 0,
): Promise<FetchERC20TransactionsResponse> => {
  const res = await fetch<FetchERC20TransactionsResponse>(
    config,
    `/addresses/${ethAddr}/transactions/erc20?${fromHeightQueryParam}=${lastHeight}&offset=${offset}&limit=${limit}`,
    {
      version: currentVersion,
    },
  );
  return res;
};

export const fetchERC20TransactionsWithPages = async (
  config: FilecoinCoinConfig,
  addr: string,
  lastHeight: number,
): Promise<ERC20Transfer[]> => {
  let result: ERC20Transfer[] = [];
  let offset = 0;
  let txsLen = txsPerPageLimit;

  while (txsLen === txsPerPageLimit) {
    const { txs } = await fetchERC20Transactions(config, addr, lastHeight, offset, txsPerPageLimit);
    result = result.concat(txs);

    txsLen = txs.length;
    offset += txsLen;
  }

  return result.sort((a, b) => b.timestamp - a.timestamp);
};
