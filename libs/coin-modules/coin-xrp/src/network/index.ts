import network from "@ledgerhq/live-network";
import coinConfig from "../config";
import {
  isResponseStatus,
  type AccountInfoResponse,
  type AccountTxResponse,
  type LedgerResponse,
  type ServerInfoResponse,
  type SubmitReponse,
} from "./types";

const getNodeUrl = () => coinConfig.getCoinConfig().node;

export const NEW_ACCOUNT_ERROR_MESSAGE = "actNotFound";

export const submit = async (signature: string): Promise<SubmitReponse> => {
  return rpcCall<SubmitReponse>("submit", { tx_blob: signature });
};

export const getAccountInfo = async (
  recipient: string,
  current?: boolean,
): Promise<AccountInfoResponse> => {
  const {
    data: { result },
  } = await network<{ result: AccountInfoResponse }>({
    method: "POST",
    url: getNodeUrl(),
    data: {
      method: "account_info",
      params: [
        {
          account: recipient,
          ledger_index: current ? "current" : "validated",
        },
      ],
    },
  });

  if (result.status !== "success" && result.error !== NEW_ACCOUNT_ERROR_MESSAGE) {
    throw new Error(`couldn't fetch account info ${recipient}`);
  }

  return result;
};

export const getServerInfos = async (): Promise<ServerInfoResponse> => {
  return rpcCall<ServerInfoResponse>("server_info", { ledger_index: "validated" });
};

export const getTransactions = async (
  address: string,
  options: { ledger_index_min?: number; ledger_index_max?: number } | undefined,
): Promise<AccountTxResponse["transactions"]> => {
  const result = await rpcCall<AccountTxResponse>("account_tx", {
    account: address,
    ledger_index: "validated",
    ...options,
  });

  return result.transactions;
};

export async function getLedger(): Promise<LedgerResponse> {
  return rpcCall<LedgerResponse>("ledger", { ledger_index: "validated" });
}

export async function getLedgerIndex(): Promise<number> {
  const result = await getLedger();

  return result.ledger_index;
}

async function rpcCall<T extends object>(
  method: string,
  params: Record<string, string | number>,
): Promise<T> {
  const {
    data: { result },
  } = await network<{ result: T }>({
    method: "POST",
    url: getNodeUrl(),
    data: {
      method,
      params: [
        {
          ...params,
        },
      ],
    },
  });

  if (isResponseStatus(result) && result.status !== "success") {
    throw new Error(`couldn't fetch ${method} with params ${params}`);
  }

  return result;
}
