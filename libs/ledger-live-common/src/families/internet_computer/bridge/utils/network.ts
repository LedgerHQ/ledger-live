import { log } from "@ledgerhq/logs";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { getEnv } from "../../../../env";
import network from "../../../../network";
import { ICP_BLK_NAME_ROSETTA, ICP_NET_ID_ROSETTA } from "../../consts";
import {
  BlockHeightResponse,
  GetBalancesResponse,
  GetTxnsHistoryResponse,
} from "./types";

const getICPURL = (path?: string): string => {
  const baseUrl = getEnv("API_ICP_ENDPOINT");
  if (!baseUrl) throw new Error("API base URL not available");

  return `${baseUrl}${path ? path : ""}`;
};

const fetch = async <T>(path: string, body: any) => {
  const url = getICPURL(path);

  // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
  const opts: AxiosRequestConfig = {
    method: "POST",
    data: body,
    url,
  };
  const rawResponse = await network(opts);
  if (
    rawResponse &&
    rawResponse.data &&
    rawResponse.data.details?.error_message
  ) {
    log("error", rawResponse.data.details?.error_message);
  }

  // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
  const { data } = rawResponse as AxiosResponse<T>;

  log("http", url);
  return data;
};

export const getICPRosettaNetworkIdentifier = () => {
  return {
    network_identifier: {
      blockchain: ICP_BLK_NAME_ROSETTA,
      network: ICP_NET_ID_ROSETTA,
    },
  };
};

export const fetchBlockHeight = async (): Promise<BlockHeightResponse> => {
  const data = await fetch<BlockHeightResponse>(
    "network/status",
    getICPRosettaNetworkIdentifier()
  );
  return data;
};

export const fetchBalances = async (
  accountId: string
): Promise<GetBalancesResponse> => {
  const body = {
    ...getICPRosettaNetworkIdentifier(),
    account_identifier: {
      address: accountId,
      metadata: {},
    },
  };
  const data = await fetch<GetBalancesResponse>("account/balance", body);
  return data;
};

export const fetchTxns = async (
  accountId: string
): Promise<GetTxnsHistoryResponse> => {
  const body = {
    ...getICPRosettaNetworkIdentifier(),
    account_identifier: {
      address: accountId,
      metadata: {},
    },
  };
  const data = await fetch<GetTxnsHistoryResponse>("search/transactions", body);
  return data;
};

export const constructionInvoke = async <TRequest, TResponse>(
  opts: TRequest,
  method: string
): Promise<TResponse> => {
  const body: TRequest = {
    ...opts,
  };

  const data = await fetch<TResponse>(`construction/${method}`, body);

  return data;
};
