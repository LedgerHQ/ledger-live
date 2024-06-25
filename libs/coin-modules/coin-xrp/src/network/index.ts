import network from "@ledgerhq/live-network";
import { NEW_ACCOUNT_ERROR_MESSAGE } from "../logic";
import { getCoinConfig } from "../config";
import {
  AccountInfoResponse,
  AccountTxResponse,
  LedgerResponse,
  ServerInfoResponse,
  SubmitReponse,
} from "./types";

export const submit = async (signature: string): Promise<SubmitReponse> => {
  const {
    data: { result },
  } = await network<{ result: SubmitReponse }>({
    method: "POST",
    url: getCoinConfig().node,
    data: {
      method: "submit",
      params: [
        {
          tx_blob: signature,
        },
      ],
    },
  });
  return result;
};

export const getAccountInfo = async (
  recipient: string,
  current?: boolean,
): Promise<AccountInfoResponse> => {
  const {
    data: { result },
  } = await network<{ result: AccountInfoResponse }>({
    method: "POST",
    url: getCoinConfig().node,
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

export const getServerInfos = async (
  endpointConfig?: string | null | undefined,
): Promise<ServerInfoResponse> => {
  const {
    data: { result },
  } = await network<{ result: ServerInfoResponse }>({
    method: "POST",
    url: endpointConfig ?? getCoinConfig().node,
    data: {
      method: "server_info",
      params: [
        {
          ledger_index: "validated",
        },
      ],
    },
  });

  if (result.status !== "success") {
    throw new Error(`couldn't fetch server info`);
  }

  return result;
};

export const getTransactions = async (
  address: string,
  options: { ledger_index_min?: number; ledger_index_max?: number } | undefined,
): Promise<AccountTxResponse["transactions"]> => {
  const {
    data: { result },
  } = await network<{ result: AccountTxResponse }>({
    method: "POST",
    url: getCoinConfig().node,
    data: {
      method: "account_tx",
      params: [
        {
          account: address,
          ledger_index: "validated",
          ...options,
        },
      ],
    },
  });

  if (result.status !== "success") {
    throw new Error(`couldn't getTransactions for ${address}`);
  }

  return result.transactions;
};

export async function getLedgerIndex(): Promise<number> {
  const {
    data: { result },
  } = await network<{ result: LedgerResponse }>({
    method: "POST",
    url: getCoinConfig().node,
    data: {
      method: "ledger",
      params: [
        {
          ledger_index: "validated",
        },
      ],
    },
  });

  if (result.status !== "success") {
    throw new Error(`couldn't fetch getLedgerIndex`);
  }

  return result.ledger_index;
}
