import network from "@ledgerhq/live-network";
import { Address } from "@ton/ton";
import { getCoinConfig } from "../../config";
import {
  TonAccountInfo,
  TonFee,
  TonJettonTransfer,
  TonJettonWallet,
  TonResponseAccountInfo,
  TonResponseEstimateFee,
  TonResponseJettonTransfer,
  TonResponseJettonWallets,
  TonResponseMasterchainInfo,
  TonResponseMessage,
  TonResponseWalletInfo,
  TonTransactionsList,
} from "./api.types";

const getTonUrl = (path?: string): string => {
  const currencyConfig = getCoinConfig();

  return `${currencyConfig.infra.API_TON_ENDPOINT}${path ?? ""}`;
};

const fetch = async <T>(path: string): Promise<T> => {
  const url = getTonUrl(path);

  const { data } = await network<T>({
    method: "GET",
    url,
  });

  return data;
};

const send = async <T>(path: string, data: Record<string, unknown>) => {
  const url = getTonUrl(path);

  const { data: dataResponse } = await network<T>({
    method: "POST",
    url,
    data: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
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

export async function fetchJettonTransactions(
  addr: string,
  opts?: {
    jettonMaster?: string;
    startLt?: string;
    endLt?: string;
  },
): Promise<TonJettonTransfer[]> {
  const address = Address.parse(addr);
  const urlAddr = address.toString({ bounceable: false, urlSafe: true });
  let url = `/jetton/transfers?address=${urlAddr}&limit=256`;
  if (opts?.jettonMaster != null) url += `&jetton_master=${opts.jettonMaster}`;
  if (opts?.startLt != null) url += `&start_lt=${opts.startLt}`;
  if (opts?.endLt != null) url += `&end_lt=${opts.endLt}`;
  return (await fetch<TonResponseJettonTransfer>(url)).jetton_transfers;
}

export async function fetchJettonWallets(opts?: {
  address?: string;
  jettonMaster?: string;
}): Promise<TonJettonWallet[]> {
  let url = `/jetton/wallets?limit=256`;
  if (opts?.jettonMaster != null) url += `&jetton_address=${opts.jettonMaster}`;
  if (opts?.address != null) {
    const address = Address.parse(opts.address);
    const urlAddr = address.toString({ bounceable: false, urlSafe: true });
    url += `&owner_address=${urlAddr}`;
  }
  return (await fetch<TonResponseJettonWallets>(url)).jetton_wallets;
}

export async function estimateFee(
  address: string,
  body: string,
  initCode?: string,
  initData?: string,
): Promise<TonFee> {
  return (
    await send<TonResponseEstimateFee>("/estimateFee", {
      address,
      body,
      init_code: initCode,
      init_data: initData,
      ignore_chksig: true,
    })
  ).source_fees;
}

export async function broadcastTx(bocBase64: string): Promise<string> {
  return (await send<TonResponseMessage>("/message", { boc: bocBase64 })).message_hash;
}
