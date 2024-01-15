import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { Address } from "@ton/ton";
import {
  TonAccountInfo,
  TonResponseAccountInfo,
  TonResponseMasterchainInfo,
  TonResponseMessage,
  TonResponseWalletInfo,
  TonTransactionsList,
} from "./api.types";

const getTonUrl = (path?: string): string => {
  const baseUrl = getEnv("API_TON_ENDPOINT");
  if (!baseUrl) throw new Error("API base URL not available");

  return `${baseUrl}${path ?? ""}`;
};

const fetch = async <T>(path: string): Promise<T> => {
  const url = getTonUrl(path);

  const { data } = await network<T>({
    method: "GET",
    url,
    headers: { "X-API-Key": getEnv("API_TON_KEY") },
  });

  return data;
};

const send = async <T>(path: string, data: Record<string, unknown>) => {
  const url = getTonUrl(path);

  const { data: dataResponse } = await network<T>({
    method: "POST",
    url,
    data: JSON.stringify(data),
    headers: { "X-API-Key": getEnv("API_TON_KEY"), "Content-Type": "application/json" },
  });

  return dataResponse;
};

export async function fetchLastBlockNumber(): Promise<number> {
  const data = await fetch<TonResponseMasterchainInfo>("/masterchainInfo");
  return data.last.seqno;
}

export async function fetchTransactions(
  addr: string,
  opts?: { startLt?: string; endLt?: string },
): Promise<TonTransactionsList> {
  const address = Address.parse(addr);
  const urlAddr = address.toString({ bounceable: false, urlSafe: true });
  let url = `/transactions?account=${urlAddr}&limit=256`;
  if (opts?.startLt != null) url += `&start_lt=${opts.startLt}`;
  if (opts?.endLt != null) url += `&end_lt=${opts.endLt}`;
  return await fetch<TonTransactionsList>(url);
}

export async function fetchAccountInfo(addr: string): Promise<TonAccountInfo> {
  const address = Address.parse(addr);
  const urlAddr = address.toString({ bounceable: false, urlSafe: true });
  const data = await fetch<TonResponseAccountInfo>(`/account?address=${urlAddr}`);
  if (data.status === "uninit" || data.status === "nonexist") {
    return {
      balance: data.balance,
      last_transaction_lt: data.last_transaction_lt,
      last_transaction_hash: data.last_transaction_hash,
      status: data.status,
      seqno: 0,
    };
  }
  const { seqno } = await fetch<TonResponseWalletInfo>(`/wallet?address=${urlAddr}`);
  return {
    balance: data.balance,
    last_transaction_lt: data.last_transaction_lt,
    last_transaction_hash: data.last_transaction_hash,
    status: data.status,
    seqno: seqno || 0,
  };
}
