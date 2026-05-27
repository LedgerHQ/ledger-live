import { createHash } from "crypto";
import bs58 from "bs58";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TRON_LOCAL_RPC } from "./fixtures";

type NodeContract = {
  parameter: { value: Record<string, unknown>; type_url: string };
  type: string;
};

type NodeTransaction = {
  ret?: Array<{ contractRet?: string; fee?: number }>;
  signature?: string[];
  txID: string;
  raw_data_hex?: string;
  raw_data: {
    contract: NodeContract[];
    ref_block_bytes?: string;
    ref_block_hash?: string;
    expiration?: number;
    timestamp?: number;
    fee_limit?: number;
    data?: string;
  };
};

type NodeBlock = {
  blockID: string;
  block_header: {
    raw_data: { number: number; timestamp: number };
  };
  transactions?: NodeTransaction[];
};

type NodeTransactionInfo = {
  id: string;
  fee?: number;
  blockNumber?: number;
  blockTimeStamp?: number;
  contractResult?: string[];
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
  blockNumber: number;
  blockTimestamp: number;
  ownerAddressHex: string;
  contractType: string;
  contract: NodeContract;
  rawData: NodeTransaction["raw_data"];
  rawDataHex: string;
  signature: string[];
  ret: Array<{ contractRet: string; fee?: number }>;
  info: NodeTransactionInfo | null;
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
  info: NodeTransactionInfo | null;
};

type Trc20Contract = {
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
};

const trackedByAddress = new Map<string, IndexedTx[]>();
const trc20ByAddress = new Map<string, Trc20Transfer[]>();
const registeredTrc20 = new Map<string, Trc20Contract>();
let lastIndexedBlock = 0;

const TRANSFER_SIGNATURE = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export function registerTrc20Contract(contract: Trc20Contract): void {
  registeredTrc20.set(contract.contractAddress, contract);
}

export function resetIndexer(): void {
  trackedByAddress.clear();
  trc20ByAddress.clear();
  registeredTrc20.clear();
  lastIndexedBlock = 0;
}

function hexToTronAddress(hex: string): string | null {
  if (!hex) return null;
  try {
    const bytes = Buffer.from(hex, "hex");
    if (bytes.length !== 21 || bytes[0] !== 0x41) return null;
    return encodeBase58Check(bytes);
  } catch {
    return null;
  }
}

function encodeBase58Check(addr21: Buffer): string {
  const checksum = createHash("sha256")
    .update(createHash("sha256").update(addr21).digest())
    .digest()
    .subarray(0, 4);
  const full = Buffer.concat([addr21, checksum]);
  return bs58.encode(full);
}

function track(address: string, tx: IndexedTx): void {
  const list = trackedByAddress.get(address) ?? [];
  if (!list.some(t => t.txID === tx.txID)) {
    list.push(tx);
    trackedByAddress.set(address, list);
  }
}

async function nodePost<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${TRON_LOCAL_RPC}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function nodeGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${TRON_LOCAL_RPC}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function indexBlocks(watchedAddresses: string[], fromBlock: number): Promise<void> {
  const head = await nodeGet<NodeBlock>("/wallet/getnowblock");
  if (!head) return;
  const headNumber = head.block_header.raw_data.number;
  const startBlock = Math.max(lastIndexedBlock + 1, fromBlock);
  const watched = new Set(watchedAddresses);

  for (let n = startBlock; n <= headNumber; n++) {
    await indexBlock(n, watched);
    lastIndexedBlock = n;
  }
}

async function indexBlock(blockNumber: number, watched: Set<string>): Promise<void> {
  const [block, infos] = await Promise.all([
    nodePost<NodeBlock>("/wallet/getblockbynum", { num: blockNumber }),
    nodePost<NodeTransactionInfo[]>("/wallet/gettransactioninfobyblocknum", { num: blockNumber }),
  ]);
  if (!block || !block.transactions) return;
  const infoById = new Map((infos ?? []).map(i => [i.id, i]));
  const ts = block.block_header.raw_data.timestamp;

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
    const ownerHex = value.owner_address;
    const owner = ownerHex ? hexToTronAddress(ownerHex) : null;
    const recipientHex = value.to_address;
    const recipient = recipientHex ? hexToTronAddress(recipientHex) : null;

    const involved = new Set<string>();
    if (owner && watched.has(owner)) involved.add(owner);
    if (recipient && watched.has(recipient)) involved.add(recipient);
    if (involved.size === 0) continue;

    const indexed: IndexedTx = {
      txID: tx.txID,
      blockNumber,
      blockTimestamp: ts,
      ownerAddressHex: ownerHex ?? "",
      contractType: contract.type,
      contract,
      rawData: tx.raw_data,
      rawDataHex: tx.raw_data_hex ?? "",
      signature: tx.signature ?? [],
      ret: (tx.ret ?? []).map(r => ({ contractRet: r.contractRet ?? "SUCCESS", fee: r.fee })),
      info: infoById.get(tx.txID) ?? null,
    };

    for (const a of involved) track(a, indexed);

    if (contract.type === "TriggerSmartContract") {
      const info = infoById.get(tx.txID);
      for (const log of info?.log ?? []) {
        const contractAddr = hexToTronAddress(`41${log.address}`);
        if (!contractAddr || !registeredTrc20.has(contractAddr)) continue;
        if (log.topics?.[0] !== TRANSFER_SIGNATURE) continue;
        const fromHex = `41${log.topics[1].slice(-40)}`;
        const toHex = `41${log.topics[2].slice(-40)}`;
        const from = hexToTronAddress(fromHex);
        const to = hexToTronAddress(toHex);
        if (!from || !to) continue;
        const value = BigInt(`0x${log.data}`).toString();
        const totalFee =
          (info?.receipt?.net_fee ?? 0) + (info?.receipt?.energy_fee ?? 0) + (info?.fee ?? 0);
        const transfer: Trc20Transfer = {
          txID: tx.txID,
          blockNumber,
          blockTimestamp: ts,
          from,
          to,
          value,
          contractAddress: contractAddr,
          fee: totalFee,
          info: info ?? null,
        };
        for (const a of [from, to]) {
          if (!watched.has(a)) continue;
          const list = trc20ByAddress.get(a) ?? [];
          if (!list.some(t => t.txID === transfer.txID && t.contractAddress === contractAddr)) {
            list.push(transfer);
            trc20ByAddress.set(a, list);
          }
        }
      }
    }
  }
}

function toTronGridTx(t: IndexedTx): Record<string, unknown> {
  const info = t.info;
  const receipt = info?.receipt ?? {};
  return {
    ret: t.ret.length ? t.ret : [{ contractRet: "SUCCESS" }],
    signature: t.signature,
    txID: t.txID,
    net_usage: receipt.net_usage ?? 0,
    raw_data_hex: t.rawDataHex,
    net_fee: receipt.net_fee ?? 0,
    energy_usage: receipt.energy_usage ?? 0,
    block_timestamp: t.blockTimestamp,
    blockNumber: t.blockNumber,
    energy_fee: receipt.energy_fee ?? 0,
    energy_usage_total: receipt.energy_usage_total ?? 0,
    raw_data: t.rawData,
    internal_transactions: [],
  };
}

function sortByTimestamp(order: "asc" | "desc"): (a: IndexedTx, b: IndexedTx) => number {
  return order === "asc"
    ? (a, b) => a.blockTimestamp - b.blockTimestamp
    : (a, b) => b.blockTimestamp - a.blockTimestamp;
}

function tronToEvmAddress(base58: string): string {
  const decoded = bs58.decode(base58);
  return Buffer.from(decoded.subarray(1, 21)).toString("hex");
}

async function fetchTrc20Balance(contract: string, owner: string): Promise<string | null> {
  const ownerHex = tronToEvmAddress(owner).padStart(64, "0");
  const res = await nodePost<{
    constant_result?: string[];
    result?: { result: boolean };
  }>("/wallet/triggerconstantcontract", {
    owner_address: owner,
    contract_address: contract,
    function_selector: "balanceOf(address)",
    parameter: ownerHex,
    visible: true,
  });
  const result = res?.constant_result?.[0];
  if (!result) return null;
  return BigInt(`0x${result}`).toString();
}

function toTrc20ApiEntry(t: Trc20Transfer): Record<string, unknown> {
  const meta = registeredTrc20.get(t.contractAddress);
  const receipt = t.info?.receipt ?? {};
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
      net_usage: receipt.net_usage ?? 0,
      net_fee: receipt.net_fee ?? 0,
      energy_usage: receipt.energy_usage ?? 0,
      energy_fee: receipt.energy_fee ?? 0,
      energy_usage_total: receipt.energy_usage_total ?? 0,
      blockNumber: t.blockNumber,
      block_timestamp: t.blockTimestamp,
    },
  };
}

export function initMswHandlers(): () => void {
  const server = setupServer(
    http.get(`${TRON_LOCAL_RPC}/v1/accounts/:address`, async ({ params }) => {
      const address = params.address as string;
      const account = await nodePost<Record<string, unknown>>("/wallet/getaccount", {
        address,
        visible: true,
      });
      if (!account || Object.keys(account).length === 0) {
        return HttpResponse.json({
          data: [],
          success: true,
          meta: { at: Date.now(), page_size: 0 },
        });
      }
      const trc20Balances: Array<Record<string, string>> = [];
      for (const [contract] of registeredTrc20) {
        const balance = await fetchTrc20Balance(contract, address);
        if (balance !== null) trc20Balances.push({ [contract]: balance });
      }
      return HttpResponse.json({
        data: [{ assetV2: [], trc20: trc20Balances, ...account }],
        success: true,
        meta: { at: Date.now(), page_size: 1 },
      });
    }),

    http.get(`${TRON_LOCAL_RPC}/v1/accounts/:address/transactions`, ({ params, request }) => {
      const address = params.address as string;
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get("limit") ?? "100", 10);
      const minTimestamp = parseInt(url.searchParams.get("min_timestamp") ?? "0", 10);
      const orderBy = url.searchParams.get("order_by") ?? "block_timestamp,desc";
      const order = orderBy.endsWith("asc") ? "asc" : "desc";

      const txs = (trackedByAddress.get(address) ?? [])
        .filter(t => t.contractType !== "TriggerSmartContract")
        .filter(t => t.blockTimestamp >= minTimestamp)
        .sort(sortByTimestamp(order))
        .slice(0, limit)
        .map(toTronGridTx);

      return HttpResponse.json({
        data: txs,
        success: true,
        meta: { at: Date.now(), page_size: txs.length },
      });
    }),

    http.get(`${TRON_LOCAL_RPC}/v1/accounts/:address/transactions/trc20`, ({ params, request }) => {
      const address = params.address as string;
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get("limit") ?? "100", 10);
      const minTimestamp = parseInt(url.searchParams.get("min_timestamp") ?? "0", 10);
      const order = (url.searchParams.get("order_by") ?? "block_timestamp,desc").endsWith("asc")
        ? "asc"
        : "desc";

      const transfers = (trc20ByAddress.get(address) ?? [])
        .filter(t => t.blockTimestamp >= minTimestamp)
        .sort((a, b) =>
          order === "asc"
            ? a.blockTimestamp - b.blockTimestamp
            : b.blockTimestamp - a.blockTimestamp,
        )
        .slice(0, limit)
        .map(t => toTrc20ApiEntry(t));

      return HttpResponse.json({
        data: transfers,
        success: true,
        meta: { at: Date.now(), page_size: transfers.length },
      });
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
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const info = await nodePost<NodeTransactionInfo>("/wallet/gettransactioninfobyid", {
      value: txID,
    });
    if (info?.id === txID && info.blockNumber !== undefined) return;
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for tx ${txID} to be included`);
}
