import network from "@ledgerhq/live-network";
import type { TonConfig } from "../config";
import type {
  TonFee,
  TonHistoryWindow,
  TonJettonTransfersList,
  TonJettonWallet,
  TonMasterchainBlock,
  TonResponseAccountInfo,
  TonResponseBlocks,
  TonResponseEstimateFee,
  TonResponseJettonWallets,
  TonResponseMasterchainInfo,
  TonResponseMessage,
  TonResponseTraces,
  TonResponseWalletInfo,
  TonTrace,
  TonTransactionsList,
} from "./types";

const JETTON_WALLETS_PAGE_SIZE = 1000;

const endpoint = (config: TonConfig): string => config.infra.API_TON_ENDPOINT;

type QueryValue = string | number | undefined | string[];

async function get<T>(
  config: TonConfig,
  path: string,
  query: Record<string, QueryValue> = {},
): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, String(item));
  }
  const search = params.toString();
  const queryString = search ? `?${search}` : "";
  const { data } = await network<T>({
    method: "GET",
    url: `${endpoint(config)}${path}${queryString}`,
  });
  return data;
}

async function post<T>(config: TonConfig, path: string, body: Record<string, unknown>): Promise<T> {
  const { data } = await network<T>({
    method: "POST",
    url: `${endpoint(config)}${path}`,
    data: body,
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

const windowQuery = (window: TonHistoryWindow): Record<string, QueryValue> => ({
  start_utime: window.startUtime,
  end_utime: window.endUtime,
  limit: window.limit,
  sort: window.sort,
});

export async function fetchMasterchainInfo(config: TonConfig): Promise<TonResponseMasterchainInfo> {
  return get<TonResponseMasterchainInfo>(config, "/masterchainInfo");
}

/** `undefined` when the block is not produced (or not indexed) yet. */
export async function fetchMasterchainBlock(
  config: TonConfig,
  seqno: number,
): Promise<TonMasterchainBlock | undefined> {
  const { blocks } = await get<TonResponseBlocks>(config, "/blocks", {
    workchain: -1,
    seqno,
    limit: 1,
  });
  return blocks[0];
}

export async function fetchAccount(
  config: TonConfig,
  address: string,
): Promise<TonResponseAccountInfo> {
  return get<TonResponseAccountInfo>(config, "/account", { address });
}

export async function fetchWallet(
  config: TonConfig,
  address: string,
): Promise<TonResponseWalletInfo> {
  return get<TonResponseWalletInfo>(config, "/wallet", { address });
}

export async function fetchJettonWallets(
  config: TonConfig,
  owner: string,
  jettonMaster?: string,
): Promise<TonJettonWallet[]> {
  const wallets: TonJettonWallet[] = [];
  for (let offset = 0; ; offset += JETTON_WALLETS_PAGE_SIZE) {
    const { jetton_wallets: page } = await get<TonResponseJettonWallets>(
      config,
      "/jetton/wallets",
      {
        owner_address: owner,
        jetton_address: jettonMaster,
        offset,
        limit: JETTON_WALLETS_PAGE_SIZE,
      },
    );
    wallets.push(...page);
    if (page.length < JETTON_WALLETS_PAGE_SIZE) return wallets;
  }
}

export async function fetchTransactions(
  config: TonConfig,
  account: string,
  window: TonHistoryWindow,
): Promise<TonTransactionsList> {
  return get<TonTransactionsList>(config, "/transactions", { account, ...windowQuery(window) });
}

/** Transfers in which `owner` is either the sender or the recipient, sorted by `utime`. */
export async function fetchJettonTransfers(
  config: TonConfig,
  owner: string,
  window: TonHistoryWindow,
): Promise<TonJettonTransfersList> {
  return get<TonJettonTransfersList>(config, "/jetton/transfers", {
    owner_address: owner,
    ...windowQuery(window),
  });
}

export async function fetchTraces(config: TonConfig, traceIds: string[]): Promise<TonTrace[]> {
  const { traces } = await get<TonResponseTraces>(config, "/traces", {
    trace_id: traceIds,
    limit: traceIds.length,
  });
  return traces;
}

export async function estimateFee(
  config: TonConfig,
  request: { address: string; body: string; initCode?: string; initData?: string },
): Promise<TonFee> {
  const { source_fees } = await post<TonResponseEstimateFee>(config, "/estimateFee", {
    address: request.address,
    body: request.body,
    init_code: request.initCode,
    init_data: request.initData,
    ignore_chksig: true,
  });
  return source_fees;
}

export async function sendMessage(config: TonConfig, boc: string): Promise<TonResponseMessage> {
  return post<TonResponseMessage>(config, "/message", { boc });
}
