import { createHash } from "crypto";
import bs58 from "bs58";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TRON_LOCAL_RPC } from "./fixtures";

type Contract = { parameter: { value: Record<string, unknown>; type_url: string }; type: string };

type RawTx = {
  ret?: Array<{ contractRet?: string; fee?: number }>;
  signature?: string[];
  txID: string;
  raw_data_hex?: string;
  raw_data: { contract: Contract[] };
};

type Block = {
  block_header: { raw_data: { number: number; timestamp: number } };
  transactions?: RawTx[];
};

type TxInfo = {
  id: string;
  fee?: number;
  blockNumber?: number;
  receipt?: {
    net_usage?: number;
    net_fee?: number;
    energy_usage?: number;
    energy_fee?: number;
    energy_usage_total?: number;
    result?: string;
  };
  log?: Array<{ address: string; topics: string[]; data: string }>;
};

type IndexedTx = {
  txID: string;
  tx: RawTx;
  blockNumber: number;
  blockTimestamp: number;
  info: TxInfo | null;
};

type Trc20Transfer = {
  txID: string;
  blockNumber: number;
  blockTimestamp: number;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  fee: number;
  info: TxInfo | null;
};

type Trc20Contract = { contractAddress: string; name: string; symbol: string; decimals: number };

const TRANSFER_SIG = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const txsByAddress = new Map<string, IndexedTx[]>();
const trc20ByAddress = new Map<string, Trc20Transfer[]>();
const trc20Contracts = new Map<string, Trc20Contract>();
let lastIndexedBlock = 0;

export function registerTrc20Contract(c: Trc20Contract): void {
  trc20Contracts.set(c.contractAddress, c);
}

export function resetIndexer(): void {
  txsByAddress.clear();
  trc20ByAddress.clear();
  trc20Contracts.clear();
  lastIndexedBlock = 0;
}

function hexToTronAddress(hex: string): string | null {
  if (!hex) return null;
  const bytes = Buffer.from(hex, "hex");
  if (bytes.length !== 21 || bytes[0] !== 0x41) return null;
  const checksum = createHash("sha256")
    .update(createHash("sha256").update(bytes).digest())
    .digest()
    .subarray(0, 4);
  return bs58.encode(Buffer.concat([bytes, checksum]));
}

function tronToHexAddress(base58: string): string {
  return Buffer.from(bs58.decode(base58).subarray(1, 21)).toString("hex");
}

async function nodeFetch<T>(path: string, body?: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${TRON_LOCAL_RPC}${path}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

function pushUnique<T extends { txID: string }>(map: Map<string, T[]>, key: string, item: T): void {
  const list = map.get(key) ?? [];
  if (!list.some(t => t.txID === item.txID)) {
    list.push(item);
    map.set(key, list);
  }
}

export async function indexBlocks(watchedAddresses: string[], fromBlock: number): Promise<void> {
  const head = await nodeFetch<Block>("/wallet/getnowblock");
  if (!head) return;
  const watched = new Set(watchedAddresses);
  const start = Math.max(lastIndexedBlock + 1, fromBlock);
  for (let n = start; n <= head.block_header.raw_data.number; n++) {
    await indexBlock(n, watched);
    lastIndexedBlock = n;
  }
}

async function indexBlock(blockNumber: number, watched: Set<string>): Promise<void> {
  const [block, infos] = await Promise.all([
    nodeFetch<Block>("/wallet/getblockbynum", { num: blockNumber }),
    nodeFetch<TxInfo[]>("/wallet/gettransactioninfobyblocknum", { num: blockNumber }),
  ]);
  if (!block?.transactions) return;
  const infoById = new Map((infos ?? []).map(i => [i.id, i]));
  const blockTimestamp = block.block_header.raw_data.timestamp;

  for (const tx of block.transactions) {
    const contract = tx.raw_data.contract[0];
    if (!contract) continue;
    const value = contract.parameter.value as {
      owner_address?: string;
      to_address?: string;
      asset_name?: string;
    };
    if (contract.type === "TransferAssetContract" && value.asset_name) {
      value.asset_name = Buffer.from(value.asset_name, "hex").toString("ascii");
    }
    const owner = hexToTronAddress(value.owner_address ?? "");
    const recipient = hexToTronAddress(value.to_address ?? "");
    const involved = [owner, recipient].filter((a): a is string => !!a && watched.has(a));
    if (!involved.length) continue;

    const info = infoById.get(tx.txID) ?? null;
    const indexed: IndexedTx = { txID: tx.txID, tx, blockNumber, blockTimestamp, info };
    for (const a of involved) pushUnique(txsByAddress, a, indexed);

    if (contract.type === "TriggerSmartContract" && info?.log) {
      collectTrc20Transfers(tx.txID, blockNumber, blockTimestamp, info, watched);
    }
  }
}

function collectTrc20Transfers(
  txID: string,
  blockNumber: number,
  blockTimestamp: number,
  info: TxInfo,
  watched: Set<string>,
): void {
  const fee = (info.receipt?.net_fee ?? 0) + (info.receipt?.energy_fee ?? 0) + (info.fee ?? 0);
  for (const log of info.log ?? []) {
    if (log.topics?.[0] !== TRANSFER_SIG) continue;
    const contractAddress = hexToTronAddress(`41${log.address}`);
    if (!contractAddress || !trc20Contracts.has(contractAddress)) continue;
    const from = hexToTronAddress(`41${log.topics[1].slice(-40)}`);
    const to = hexToTronAddress(`41${log.topics[2].slice(-40)}`);
    if (!from || !to) continue;
    const transfer: Trc20Transfer = {
      txID,
      blockNumber,
      blockTimestamp,
      from,
      to,
      value: BigInt(`0x${log.data}`).toString(),
      contractAddress,
      fee,
      info,
    };
    for (const a of [from, to]) {
      if (watched.has(a)) pushUnique(trc20ByAddress, a, transfer);
    }
  }
}

function byTimestamp(
  order: "asc" | "desc",
): (a: { blockTimestamp: number }, b: { blockTimestamp: number }) => number {
  return order === "asc"
    ? (a, b) => a.blockTimestamp - b.blockTimestamp
    : (a, b) => b.blockTimestamp - a.blockTimestamp;
}

function parseListParams(request: Request): {
  limit: number;
  minTimestamp: number;
  order: "asc" | "desc";
} {
  const url = new URL(request.url);
  return {
    limit: parseInt(url.searchParams.get("limit") ?? "100", 10),
    minTimestamp: parseInt(url.searchParams.get("min_timestamp") ?? "0", 10),
    order: (url.searchParams.get("order_by") ?? "block_timestamp,desc").endsWith("asc")
      ? "asc"
      : "desc",
  };
}

function tronGridResponse(data: unknown[]) {
  return HttpResponse.json({
    data,
    success: true,
    meta: { at: Date.now(), page_size: data.length },
  });
}

function toTronGridTx({
  tx,
  blockNumber,
  blockTimestamp,
  info,
}: IndexedTx): Record<string, unknown> {
  const r = info?.receipt ?? {};
  return {
    ret: tx.ret?.length ? tx.ret : [{ contractRet: "SUCCESS" }],
    signature: tx.signature ?? [],
    txID: tx.txID,
    net_usage: r.net_usage ?? 0,
    raw_data_hex: tx.raw_data_hex ?? "",
    net_fee: r.net_fee ?? 0,
    energy_usage: r.energy_usage ?? 0,
    block_timestamp: blockTimestamp,
    blockNumber,
    energy_fee: r.energy_fee ?? 0,
    energy_usage_total: r.energy_usage_total ?? 0,
    raw_data: tx.raw_data,
    internal_transactions: [],
  };
}

function toTrc20Entry(t: Trc20Transfer): Record<string, unknown> {
  const meta = trc20Contracts.get(t.contractAddress);
  const r = t.info?.receipt ?? {};
  return {
    transaction_id: t.txID,
    token_info: {
      address: t.contractAddress,
      symbol: meta?.symbol ?? "",
      decimals: meta?.decimals ?? 0,
      name: meta?.name ?? "",
    },
    block_timestamp: t.blockTimestamp,
    from: t.from,
    to: t.to,
    type: "Transfer",
    value: t.value,
    detail: {
      txID: t.txID,
      ret: [{ contractRet: "SUCCESS", fee: t.fee }],
      signature: [],
      raw_data_hex: "",
      raw_data: { contract: [] },
      internal_transactions: [],
      net_usage: r.net_usage ?? 0,
      net_fee: r.net_fee ?? 0,
      energy_usage: r.energy_usage ?? 0,
      energy_fee: r.energy_fee ?? 0,
      energy_usage_total: r.energy_usage_total ?? 0,
      blockNumber: t.blockNumber,
      block_timestamp: t.blockTimestamp,
    },
  };
}

async function fetchTrc20Balance(contract: string, owner: string): Promise<string | null> {
  const res = await nodeFetch<{ constant_result?: string[] }>("/wallet/triggerconstantcontract", {
    owner_address: owner,
    contract_address: contract,
    function_selector: "balanceOf(address)",
    parameter: tronToHexAddress(owner).padStart(64, "0"),
    visible: true,
  });
  const raw = res?.constant_result?.[0];
  return raw ? BigInt(`0x${raw}`).toString() : null;
}

export function initMswHandlers(): () => void {
  const server = setupServer(
    http.get(`${TRON_LOCAL_RPC}/v1/accounts/:address`, async ({ params }) => {
      const address = params.address as string;
      const account = await nodeFetch<Record<string, unknown>>("/wallet/getaccount", {
        address,
        visible: true,
      });
      if (!account || Object.keys(account).length === 0) return tronGridResponse([]);
      const trc20: Array<Record<string, string>> = [];
      for (const [contract] of trc20Contracts) {
        const balance = await fetchTrc20Balance(contract, address);
        if (balance !== null) trc20.push({ [contract]: balance });
      }
      return tronGridResponse([{ assetV2: [], trc20, ...account }]);
    }),

    http.get(`${TRON_LOCAL_RPC}/v1/accounts/:address/transactions`, ({ params, request }) => {
      const { limit, minTimestamp, order } = parseListParams(request);
      const txs = (txsByAddress.get(params.address as string) ?? [])
        .filter(
          t =>
            t.tx.raw_data.contract[0].type !== "TriggerSmartContract" &&
            t.blockTimestamp >= minTimestamp,
        )
        .sort(byTimestamp(order))
        .slice(0, limit)
        .map(toTronGridTx);
      return tronGridResponse(txs);
    }),

    http.get(`${TRON_LOCAL_RPC}/v1/accounts/:address/transactions/trc20`, ({ params, request }) => {
      const { limit, minTimestamp, order } = parseListParams(request);
      const transfers = (trc20ByAddress.get(params.address as string) ?? [])
        .filter(t => t.blockTimestamp >= minTimestamp)
        .sort(byTimestamp(order))
        .slice(0, limit)
        .map(toTrc20Entry);
      return tronGridResponse(transfers);
    }),
  );

  server.listen({
    onUnhandledRequest: req => {
      const hostname = new URL(req.url).hostname;
      if (["127.0.0.1", "localhost"].includes(hostname)) return;
      throw new Error(`Unhandled MSW request: ${req.method} ${req.url}`);
    },
  });

  return () => server.close();
}

export async function waitForOperationInclusion(txID: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const info = await nodeFetch<TxInfo>("/wallet/gettransactioninfobyid", { value: txID });
    if (info?.id === txID && info.blockNumber !== undefined) return;
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for tx ${txID} to be included`);
}
