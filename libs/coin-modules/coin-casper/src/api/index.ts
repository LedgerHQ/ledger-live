import { log } from "@ledgerhq/logs";
import { AxiosRequestConfig, AxiosResponse } from "axios";

import {
  NDeployMessagePutResponse,
  IndexerResponseRoot,
  ITxnHistoryData,
  NAccountBalance,
  NAccountInfo,
  NNetworkStatusResponse,
  NodeResponseRoot,
  NodeRPCPayload,
  NStateRootHashResponse,
} from "./types";

import network from "@ledgerhq/live-network/network";
import { AccessRights, CLURef, DeployUtil } from "casper-js-sdk";
import { getEnv } from "@ledgerhq/live-env";

const getCasperIndexerURL = (path: string): string => {
  const baseUrl = getEnv("API_CASPER_INDEXER_ENDPOINT");
  if (!baseUrl) throw new Error("API base URL not available");

  return `${baseUrl}${path}`;
};

const getCasperNodeURL = (): string => {
  const baseUrl = getEnv("API_CASPER_NODE_ENDPOINT");
  if (!baseUrl) throw new Error("API base URL not available");

  return baseUrl;
};

const casperIndexerWrapper = async <T>(path: string) => {
  const url = getCasperIndexerURL(path);
  const getResponse = async (page: number) => {
    // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
    const opts: AxiosRequestConfig = {
      method: "GET",
      url: `${url}?limit=100&page=${page}`,
    };

    const rawResponse = await network(opts);
    // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
    const { data } = rawResponse as AxiosResponse<IndexerResponseRoot<T>>;

    return data;
  };

  let page = 1;
  const res: T[] = [];

  const data = await getResponse(page);
  const { pageCount } = data;
  res.push(...data.data);

  while (page <= pageCount) {
    page++;
    const data = await getResponse(page);
    res.push(...data.data);
  }

  log("http", url);
  return res;
};

const casperNodeWrapper = async <T>(payload: NodeRPCPayload) => {
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

export const fetchAccountStateInfo = async (
  publicKey: string,
): Promise<{
  purseUref: CLURef | undefined;
  accountHash: string | undefined;
}> => {
  const accountStateInfo = await casperNodeWrapper<NAccountInfo>({
    jsonrpc: "2.0",
    method: "state_get_account_info",
    params: {
      public_key: publicKey,
    },
    id: 1,
  });

  if (!accountStateInfo) {
    return {
      purseUref: undefined,
      accountHash: undefined,
    };
  }

  const accountHash = accountStateInfo.account.account_hash.split("-")[2];
  const purseURefString = accountStateInfo.account.main_purse.split("-")[1];

  const uRef = new CLURef(Buffer.from(purseURefString, "hex"), AccessRights.READ_ADD_WRITE);

  return { purseUref: uRef, accountHash };
};

export const fetchBalance = async (purseUref: CLURef): Promise<NAccountBalance> => {
  const stateRootInfo = await casperNodeWrapper<NStateRootHashResponse>({
    jsonrpc: "2.0",
    method: "chain_get_state_root_hash",
    params: null,
    id: 1,
  });

  const accountBalance = await casperNodeWrapper<NAccountBalance>({
    jsonrpc: "2.0",
    method: "state_get_balance",
    params: {
      purse_uref: purseUref.toFormattedStr(),
      state_root_hash: stateRootInfo.state_root_hash,
    },
    id: 1,
  });

  return accountBalance;
};

export const fetchNetworkStatus = async (): Promise<NNetworkStatusResponse> => {
  const payload: NodeRPCPayload = {
    id: 1,
    jsonrpc: "2.0",
    method: "info_get_status",
    params: null,
  };
  const data = await casperNodeWrapper<NNetworkStatusResponse>(payload);

  return data;
};

export const fetchTxs = async (addr: string): Promise<ITxnHistoryData[]> => {
  const response = await casperIndexerWrapper<ITxnHistoryData>(
    `/accounts/${addr}/ledgerlive-deploys`,
  );
  return response;
};

export const broadcastTx = async (
  deploy: DeployUtil.Deploy,
): Promise<NDeployMessagePutResponse> => {
  const response = await casperNodeWrapper<NDeployMessagePutResponse>({
    id: 1,
    jsonrpc: "2.0",
    method: "account_put_deploy",
    params: DeployUtil.deployToJson(deploy),
  });

  return response;
};
