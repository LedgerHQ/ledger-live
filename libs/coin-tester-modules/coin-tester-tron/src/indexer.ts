import bs58check from "bs58check";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TRON_LOCAL_URL, TRON_MOCK_URL } from "./fixtures";

/**
 * Address encoders, mirrored from coin-tron's `network/format.ts`.
 *   - hex addresses produced by java-tron are 21 bytes (0x41-prefixed) hex-encoded.
 *   - Base58Check addresses are 21 bytes + 4-byte checksum, base58-encoded.
 */
export const encode58Check = (hex: string): string =>
  bs58check.encode(Buffer.from(hex, "hex"));

export const decode58Check = (base58: string): string =>
  Buffer.from(bs58check.decode(base58)).toString("hex");

/** Forward a request to the local java-tron node, rewriting the host. */
function passThrough(path: string, method: "GET" | "POST") {
  const handler = method === "GET" ? http.get : http.post;
  return handler(`${TRON_MOCK_URL}${path}`, async ({ request }) => {
    const body = method === "POST" ? await request.text() : undefined;
    const url = new URL(request.url);
    const upstream = await fetch(`${TRON_LOCAL_URL}${path}${url.search}`, {
      method,
      headers: { "content-type": "application/json" },
      body,
    });
    return new HttpResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  });
}

interface NodeBlock {
  block_header: { raw_data: { number: number; timestamp: number } };
  blockID: string;
  transactions?: NodeTransaction[];
}

interface NodeTransaction {
  txID: string;
  raw_data: {
    contract: { type: string; parameter: { value: Record<string, unknown> } }[];
    timestamp?: number;
  };
  ret?: { contractRet: string }[];
}

interface IndexedNativeTx {
  txID: string;
  blockNumber: number;
  block_timestamp: number;
  raw_data: NodeTransaction["raw_data"];
  ret: NodeTransaction["ret"];
}

interface IndexedTrc20Tx {
  transaction_id: string;
  block_timestamp: number;
  from: string;
  to: string;
  value: string;
  token_info: { address: string; symbol?: string; decimals?: number };
  type: "Transfer";
  /**
   * coin-tron's `formatTrongridTrc20TxResponse` reads `tx.detail.ret[0].fee`
   * and `tx.detail.raw_data.contract[0].parameter.value.{contract_address, owner_address}`.
   * The `detail.ret` array also gates the validity check in `getTrc20TxsWithRetry`.
   */
  detail: {
    ret: { fee: number; contractRet?: string }[];
    raw_data: NodeTransaction["raw_data"];
  };
}

const watched: Set<string> = new Set();
const trackedTrc20Contracts: Set<string> = new Set();
let nativeTxs: IndexedNativeTx[] = [];
let trc20Txs: IndexedTrc20Tx[] = [];
let lastIndexedBlock = 0;

export function resetIndexer(): void {
  watched.clear();
  trackedTrc20Contracts.clear();
  nativeTxs = [];
  trc20Txs = [];
  lastIndexedBlock = 0;
}

/**
 * Reads `balanceOf(holder)` from a TRC-20 contract via constant_contract call.
 * Returns the raw balance as a string (decimal).
 */
async function fetchTrc20Balance(contractAddress: string, holder: string): Promise<string> {
  // ABI: `balanceOf(address)` selector = 70a08231; address is right-padded to 32 bytes.
  const holderHex = decode58Check(holder);
  // Strip the 0x41 prefix → 20-byte address, left-pad to 32 bytes.
  const param = holderHex.slice(2).padStart(64, "0");
  const result = await nodePost<{ constant_result?: string[] }>(
    "/wallet/triggerconstantcontract",
    {
      owner_address: holderHex,
      contract_address: decode58Check(contractAddress),
      function_selector: "balanceOf(address)",
      parameter: param,
    },
  );
  const hex = result?.constant_result?.[0];
  if (!hex) return "0";
  return BigInt("0x" + hex).toString();
}

async function nodeGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${TRON_LOCAL_URL}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function nodePost<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${TRON_LOCAL_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function hexToAscii(hex: string): string {
  let out = "";
  for (let i = 0; i < hex.length; i += 2) {
    out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  }
  return out;
}

/**
 * java-tron blocks return TRC-10 `asset_name` as ASCII-hex (e.g. "31303030303031"
 * for "1000001"). TronGrid's `/v1/accounts/:addr/transactions` API decodes
 * it before returning — coin-tron relies on that (sets `tx.tokenId = asset_name`
 * directly). Mirror that decoding here so the bridge sees what it expects.
 */
function normalizeTransferAsset(tx: NodeTransaction): NodeTransaction {
  if (tx.raw_data.contract[0]?.type !== "TransferAssetContract") return tx;
  const value = tx.raw_data.contract[0].parameter.value as { asset_name?: string };
  if (!value.asset_name) return tx;
  const decoded = hexToAscii(value.asset_name);
  // Only rewrite if the result is a plain ASCII digit string (sanity check).
  if (!/^\d+$/.test(decoded)) return tx;
  value.asset_name = decoded;
  return tx;
}

async function indexBlocks(): Promise<void> {
  const head = await nodeGet<NodeBlock>("/wallet/getnowblock");
  if (!head) return;
  const headNumber = head.block_header.raw_data.number;
  for (let n = lastIndexedBlock + 1; n <= headNumber; n++) {
    // `/wallet/getblock` was added in newer java-tron releases — the older
    // version shipped by `trontools/quickstart` returns 404. Use the legacy
    // `/wallet/getblockbynum` instead, which is functionally equivalent and
    // available on every supported java-tron version.
    const block = await nodePost<NodeBlock>("/wallet/getblockbynum", {
      num: n,
    });
    if (!block) continue;
    const blockNumber = block.block_header.raw_data.number;
    const blockTimestamp = block.block_header.raw_data.timestamp;
    for (const rawTx of block.transactions ?? []) {
      const tx = normalizeTransferAsset(rawTx);
      const contract = tx.raw_data.contract[0];
      if (!contract) continue;
      const value = contract.parameter.value as {
        owner_address?: string;
        to_address?: string;
        contract_address?: string;
        data?: string;
      };
      const owner = value.owner_address ? encode58Check(value.owner_address) : "";
      const recipient = value.to_address ? encode58Check(value.to_address) : "";
      const involvedNative = watched.has(owner) || watched.has(recipient);

      if (
        involvedNative &&
        (contract.type === "TransferContract" || contract.type === "TransferAssetContract")
      ) {
        nativeTxs.push({
          txID: tx.txID,
          blockNumber,
          block_timestamp: blockTimestamp,
          raw_data: tx.raw_data,
          ret: tx.ret,
        });
        continue;
      }

      // TRC-20 transfer(address,uint256) — selector a9059cbb
      if (contract.type === "TriggerSmartContract" && value.data && value.contract_address) {
        const data = value.data;
        if (!data.toLowerCase().startsWith("a9059cbb")) continue;
        // ABI: 4-byte selector + 32-byte to (right-padded uint160) + 32-byte value
        const toHex = "41" + data.slice(8 + 24, 8 + 64);
        const valueHex = data.slice(8 + 64, 8 + 128);
        const to = encode58Check(toHex);
        const from = encode58Check(value.owner_address ?? "");
        if (!watched.has(from) && !watched.has(to)) continue;
        trc20Txs.push({
          transaction_id: tx.txID,
          block_timestamp: blockTimestamp,
          from,
          to,
          value: BigInt("0x" + valueHex).toString(),
          token_info: { address: encode58Check(value.contract_address) },
          type: "Transfer",
          detail: {
            // Must be a non-empty array — coin-tron's `getTrc20TxsWithRetry`
            // discards entries with an empty `ret` and retries until they
            // appear, hanging otherwise. java-tron's raw block format
            // usually has it, but we default to a synthetic SUCCESS entry.
            ret:
              tx.ret && tx.ret.length > 0
                ? tx.ret.map((r) => ({ fee: 0, contractRet: r.contractRet }))
                : [{ fee: 0, contractRet: "SUCCESS" }],
            raw_data: tx.raw_data,
          },
        });
      }
    }
    lastIndexedBlock = blockNumber;
  }
}

/**
 * MSW server. Two classes of handlers:
 *   1. Custom TronGrid v1 endpoints — java-tron does not serve these. The
 *      indexer assembles them from block scans.
 *   2. Pass-throughs for /wallet/* — direct URL rewrite to the local node.
 */
export function initMswHandlers(
  watchedAddress: string,
  trc20ContractAddresses: string[] = [],
): () => void {
  watched.add(watchedAddress);
  trc20ContractAddresses.forEach((c) => trackedTrc20Contracts.add(c));

  const server = setupServer(
    // ─── TronGrid v1 (custom indexer) ────────────────────────────────────
    http.get(`${TRON_MOCK_URL}/v1/accounts/:address`, async ({ params }) => {
      const address = params.address as string;
      const account = await nodePost<{
        balance?: number;
        create_time?: number;
        assetV2?: { key: string; value: number }[];
      }>("/wallet/getaccount", { address: decode58Check(address) });
      const trc20 = await Promise.all(
        Array.from(trackedTrc20Contracts).map(async (contract) => ({
          [contract]: await fetchTrc20Balance(contract, address),
        })),
      );
      return HttpResponse.json({
        data: [
          {
            address,
            balance: account?.balance ?? 0,
            create_time: account?.create_time ?? 0,
            assetV2: account?.assetV2 ?? [],
            trc20,
          },
        ],
        success: true,
        meta: { at: Date.now(), page_size: 1 },
      });
    }),

    http.get(`${TRON_MOCK_URL}/v1/accounts/:address/transactions`, async ({ params, request }) => {
      const address = params.address as string;
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
      const order = url.searchParams.get("order_by")?.includes(",asc") ? "asc" : "desc";
      await indexBlocks();
      const matching = nativeTxs.filter((tx) => {
        const c = tx.raw_data.contract[0].parameter.value as {
          owner_address?: string;
          to_address?: string;
        };
        return (
          encode58Check(c.owner_address ?? "") === address ||
          encode58Check(c.to_address ?? "") === address
        );
      });
      const sorted = matching.sort((a, b) =>
        order === "asc"
          ? a.block_timestamp - b.block_timestamp
          : b.block_timestamp - a.block_timestamp,
      );
      return HttpResponse.json({
        data: sorted.slice(0, limit),
        success: true,
        meta: { at: Date.now(), page_size: limit, links: {} },
      });
    }),

    http.get(
      `${TRON_MOCK_URL}/v1/accounts/:address/transactions/trc20`,
      async ({ params, request }) => {
        const address = params.address as string;
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
        const order = url.searchParams.get("order_by")?.includes(",asc") ? "asc" : "desc";
        await indexBlocks();
        const matching = trc20Txs.filter((tx) => tx.from === address || tx.to === address);
        const sorted = matching.sort((a, b) =>
          order === "asc"
            ? a.block_timestamp - b.block_timestamp
            : b.block_timestamp - a.block_timestamp,
        );
        return HttpResponse.json({
          data: sorted.slice(0, limit),
          success: true,
          meta: { at: Date.now(), page_size: limit, links: {} },
        });
      },
    ),

    // ─── /wallet/* pass-throughs ─────────────────────────────────────────
    passThrough("/wallet/getnowblock", "GET"),
    passThrough("/wallet/getblock", "POST"),
    passThrough("/wallet/getblockbynum", "POST"),
    passThrough("/wallet/gettransactioninfobyblocknum", "POST"),
    passThrough("/wallet/gettransactioninfobyid", "GET"),
    passThrough("/wallet/getaccount", "POST"),
    passThrough("/wallet/getaccountresource", "GET"),
    passThrough("/wallet/createtransaction", "POST"),
    passThrough("/wallet/transferasset", "POST"),
    passThrough("/wallet/triggersmartcontract", "POST"),
    passThrough("/wallet/triggerconstantcontract", "POST"),
    passThrough("/wallet/getsignweight", "POST"),
    passThrough("/wallet/broadcasttransaction", "POST"),
    passThrough("/wallet/broadcasthex", "POST"),
    passThrough("/wallet/validateaddress", "POST"),
    passThrough("/wallet/getcontract", "POST"),
    passThrough("/wallet/getReward", "GET"),
    passThrough("/wallet/listwitnesses", "GET"),
    passThrough("/wallet/getnextmaintenancetime", "GET"),
  );

  server.listen({
    onUnhandledRequest: (req) => {
      const hostname = new URL(req.url).hostname;
      if (["127.0.0.1", "localhost"].includes(hostname)) return;
      throw new Error(`Unhandled MSW request: ${req.method} ${req.url}`);
    },
  });

  return () => server.close();
}
