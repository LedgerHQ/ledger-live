import { log } from "@ledgerhq/logs";

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

import network from "@ledgerhq/live-network";
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

  try {
    const rawResponse = await network<IndexerResponseRoot<T>>({
      method: "GET",
      url,
    });
    log("http", url);

    const { data, status } = rawResponse;
    if (status >= 300) {
      log("http", url, data);
    }
    return data;
  } catch (error) {
    log("error", "Casper indexer error: ", error);
    throw error;
  }
};

const casperNodeWrapper = async <T>(payload: NodeRPCPayload) => {
  const url = getCasperNodeURL();

  try {
    const rawResponse = await network<NodeResponseRoot<T>>({
      method: "POST",
      url,
      data: payload,
    });
    log("http", `${url} - ${payload.method}`);

    const { data, status } = rawResponse;

    if (status >= 300) {
      log("http", `${url} - Status: ${status}`, data);
      throw new Error(`HTTP error: ${status}`);
    }

    if (data.error) {
      const errorMessage = data.error.message + ". " + data.error.data || "Unknown error";
      log("http", `${payload.method} - ${errorMessage}`);
      throw new Error(`Casper node error: ${errorMessage}`);
    }

    if (!data.result) {
      throw new Error(`Casper node returned no result for method: ${payload.method}`);
    }

    return data.result;
  } catch (error) {
    log("error", `Failed to execute ${payload.method}`, error);
    throw error instanceof Error
      ? error
      : new Error(`Unknown error during Casper node request: ${String(error)}`);
  }
};

export const fetchAccountStateInfo = async (
  publicKey: string,
): Promise<{
  purseUref: CLURef | undefined;
  accountHash: string | undefined;
}> => {
  try {
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
  } catch (error) {
    if (error instanceof Error && error.message.includes("ValueNotFound")) {
      return {
        purseUref: undefined,
        accountHash: undefined,
      };
    }
    throw error;
  }
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
  let page = 1;
  let res: ITxnHistoryData[] = [];
  const limit = 100;

  let response = await casperIndexerWrapper<ITxnHistoryData>(
    `/accounts/${addr}/ledgerlive-deploys?limit=${limit}&page=${page}`,
  );
  res = res.concat(response.data);

  while (response.pageCount > page) {
    page++;
    response = await casperIndexerWrapper<ITxnHistoryData>(
      `/accounts/${addr}/ledgerlive-deploys?limit=${limit}&page=${page}`,
    );
    res = res.concat(response.data);
  }
  return res;
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
