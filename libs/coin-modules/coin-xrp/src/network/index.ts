import network from "@ledgerhq/live-network";
import coinConfig from "../config";
import type { AccountInfo } from "../types/model";
import {
  isErrorResponse,
  isResponseStatus,
  Marker,
  type AccountInfoResponse,
  type AccountTxResponse,
  type ErrorResponse,
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
): Promise<AccountInfo> => {
  const {
    data: { result },
  } = await network<{ result: AccountInfoResponse | ErrorResponse }>({
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

  if (isErrorResponse(result)) {
    return {
      isNewAccount: true,
      balance: "0",
      ownerCount: 0,
      sequence: 0,
    };
  } else {
    return {
      isNewAccount: false,
      balance: result.account_data.Balance,
      ownerCount: result.account_data.OwnerCount,
      sequence: result.account_data.Sequence,
    };
  }
};

export const getServerInfos = async (): Promise<ServerInfoResponse> => {
  return rpcCall<ServerInfoResponse>("server_info", { ledger_index: "validated" });
};

// https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/account-methods/account_tx
export type GetTransactionsOptions = {
  ledger_index_min?: number;
  ledger_index_max?: number;
  limit?: number;
  marker?: Marker;
  // this property controls the order of the transactions
  // true: oldest first
  // false: newest first
  forward: boolean;
};

export const getTransactions = async (
  address: string,
  options: GetTransactionsOptions | undefined,
): Promise<AccountTxResponse> => {
  const result = await rpcCall<AccountTxResponse>("account_tx", {
    account: address,
    // this property controls the order of the transactions
    // looks like there is a bug in LL (https://ledgerhq.atlassian.net/browse/LIVE-16705)
    // so we need to set it to false (newest first) to get the transactions in the right order
    // for lama-adapter we need to set it to true (oldest first)
    ...options,
    api_version: 2,
  });
  return result;
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
  params: Record<string, unknown> = {},
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
    throw new Error(`couldn't fetch ${method} with params ${JSON.stringify(params)}`);
  }

  return result;
}
