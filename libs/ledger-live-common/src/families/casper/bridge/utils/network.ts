import { log } from "@ledgerhq/logs";
import { AxiosRequestConfig, AxiosResponse } from "axios";

import {
  NDeployMessagePutResponse,
  LiveResponseRoot,
  LTxnHistoryData,
  NAccountBalance,
  NAccountInfo,
  NNetworkStatusResponse,
  NodeResponseRoot,
  NodeRPCPayload,
  NStateRootHashResponse,
} from "./types";

import network from "../../../../network";
import { getEnv } from "../../../../env";
import { AccessRights, CLURef, DeployUtil } from "casper-js-sdk";
import { CASPER_FEES } from "../../consts";

const getCasperLiveURL = (path: string): string => {
  const baseUrl = getEnv("API_CASPER_LIVE_ENDPOINT");
  if (!baseUrl) throw new Error("API base URL not available");

  return `${baseUrl}${path}`;
};

const getCasperNodeURL = (): string => {
  const baseUrl = getEnv("API_CASPER_NODE_ENDPOINT");
  if (!baseUrl) throw new Error("API base URL not available");

  return baseUrl;
};

const live = async <T>(path: string) => {
  const url = getCasperLiveURL(path);
  const fetch = async (page: number) => {
    // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
    const opts: AxiosRequestConfig = {
      method: "POST",
      url: `${url}&limit=100&page=${page}`,
    };

    const rawResponse = await network(opts);
    // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
    const { data } = rawResponse as AxiosResponse<LiveResponseRoot<T>>;

    return data;
  };

  let page = 1;
  const res: T[] = [];

  const data = await fetch(page);
  const { pageCount } = data;
  res.push(...data.data);

  while (page <= pageCount) {
    page++;
    const data = await fetch(page);
    res.push(...data.data);
  }

  log("http", url);
  return res;
};

const node = async <T>(payload: NodeRPCPayload) => {
  const url = getCasperNodeURL();

  // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
  const opts: AxiosRequestConfig = {
    method: "POST",
    url,
    data: payload,
  };
  const rawResponse = await network(opts);

  // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
  const { data } = rawResponse as AxiosResponse<NodeResponseRoot<T>>;

  log("http", url);
  return data.result;
};

// const send = async <T>(path: string, data: Record<string, any>) => { //   const url = getCasperURL(path);

//   const opts: AxiosRequestConfig = {
//     method: "POST",
//     url,
//     data: JSON.stringify(data),
//     headers: { "Content-Type": "application/json" },
//   };

//   const rawResponse = await network(opts);

//   // We force data to this way as network func is not using generics. Changing that func will generate errors in other implementations
//   const { data: responseData } = rawResponse as AxiosResponse<T>;

//   log("http", url);
//   return responseData;
// };

export const getPurseURef = async (publicKey: string): Promise<CLURef> => {
  const accountStateInfo = await node<NAccountInfo>({
    jsonrpc: "2.0",
    method: "state_get_account_info",
    params: {
      public_key: publicKey,
    },
    id: 1,
  });

  const purseURefString = accountStateInfo.account.main_purse.split("-")[1];
  const uRef = new CLURef(
    Buffer.from(purseURefString, "hex"),
    AccessRights.READ_ADD_WRITE
  );

  return uRef;
};

export const fetchBalances = async (
  publicKey: string
): Promise<NAccountBalance> => {
  const stateRootInfo = await node<NStateRootHashResponse>({
    jsonrpc: "2.0",
    method: "chain_get_state_root_hash",
    params: null,
    id: 1,
  });

  const uRef = await getPurseURef(publicKey);

  const accountBalance = await node<NAccountBalance>({
    jsonrpc: "2.0",
    method: "state_get_balance",
    params: {
      purse_uref: uRef.toFormattedStr(),
      state_root_hash: stateRootInfo.state_root_hash,
    },
    id: 1,
  });

  return accountBalance; // TODO Validate if the response fits this interface
};

export const fetchEstimatedFees = async (): Promise<{
  fees: number;
  unit: string;
}> => {
  return {
    fees: CASPER_FEES,
    unit: "CSPR",
  }; // TODO Validate if the response fits this interface
};

export const fetchBlockHeight = async (): Promise<NNetworkStatusResponse> => {
  const payload: NodeRPCPayload = {
    id: 1,
    jsonrpc: "2.0",
    method: "info_get_status",
    params: null,
  };
  const data = await node<NNetworkStatusResponse>(payload);

  return data; // TODO Validate if the response fits this interface
};

export const fetchTxs = async (addr: string): Promise<LTxnHistoryData[]> => {
  const response = await live<LTxnHistoryData>(
    `/transfers?accountHash=${addr}`
  );
  return response; // TODO Validate if the response fits this interface
};

export const broadcastTx = async (
  deploy: DeployUtil.Deploy
): Promise<NDeployMessagePutResponse> => {
  const response = await node<NDeployMessagePutResponse>({
    id: 1,
    jsonrpc: "2.0",
    method: "account_put_deploy",
    params: deploy,
  });

  return response; // TODO Validate if the response fits this interface
};
