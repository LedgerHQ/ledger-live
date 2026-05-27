import http from "http";
import { setupServer } from "msw/node";
import { http as mswHttp, HttpResponse } from "msw";
import { LOTUS_RPC_URL } from "./lotus";
import type {
  BalanceResponse,
  BroadcastTransactionRequest,
  BroadcastTransactionResponse,
  EstimatedFeesRequest,
  EstimatedFeesResponse,
  NetworkStatusResponse,
  TransactionResponse,
  TransactionsResponse,
  ERC20BalanceResponse,
  FetchERC20TransactionsResponse,
} from "@ledgerhq/coin-filecoin/types";

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

interface TrackedMessage {
  cid: string;
  to: string;
  from: string;
  value: string;
  method: number;
  height: number;
  timestamp: number;
  exitCode: number;
  gasUsed: number;
  gasFeeCap: string;
  gasPremium: string;
  gasLimit: number;
  nonce: number;
}

let trackedMessages: TrackedMessage[] = [];
let pendingCids: string[] = [];
let adminToken: string | null = null;

export function setAdminToken(token: string): void {
  adminToken = token;
}

export function resetIndexer(): void {
  trackedMessages = [];
  pendingCids = [];
  adminToken = null;
}

// ---------------------------------------------------------------------------
// Lotus RPC helper
// ---------------------------------------------------------------------------

async function lotusRpc<T>(method: string, params: unknown[]): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;

  const response = await fetch(LOTUS_RPC_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  const json = (await response.json()) as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(`Lotus RPC (${method}): ${json.error.message}`);
  return json.result as T;
}

function toMainnetAddr(addr: string): string {
  return addr.startsWith("t") ? "f" + addr.slice(1) : addr;
}

function toTestnetAddr(addr: string): string {
  return addr.startsWith("f") ? "t" + addr.slice(1) : addr;
}

// ---------------------------------------------------------------------------
// Resolve pending messages (called from mockIndexer hook, OUTSIDE MSW)
// ---------------------------------------------------------------------------

export async function resolvePendingMessages(): Promise<void> {
  const toResolve = [...pendingCids];
  pendingCids = [];

  for (const cid of toResolve) {
    try {
      await lotusRpc("Filecoin.StateWaitMsg", [{ "/": cid }, 1, 0, true]);

      const replay = await lotusRpc<{
        Msg: { To: string; From: string; Value: string; Method: number; Nonce: number; GasLimit: number; GasFeeCap: string; GasPremium: string };
        MsgRct: { ExitCode: number; GasUsed: number };
      }>("Filecoin.StateReplay", [[], { "/": cid }]);

      const head = await lotusRpc<{ Height: number; Blocks: Array<{ Timestamp: number }> }>("Filecoin.ChainHead", []);

      trackedMessages.push({
        cid,
        to: replay.Msg.To,
        from: replay.Msg.From,
        value: replay.Msg.Value,
        method: replay.Msg.Method,
        nonce: replay.Msg.Nonce,
        height: head.Height,
        timestamp: head.Blocks[0]?.Timestamp ?? Math.floor(Date.now() / 1000),
        exitCode: replay.MsgRct.ExitCode,
        gasUsed: replay.MsgRct.GasUsed,
        gasFeeCap: replay.Msg.GasFeeCap,
        gasPremium: replay.Msg.GasPremium,
        gasLimit: replay.Msg.GasLimit,
      });

      console.log(`Indexed message ${cid} (ExitCode: ${replay.MsgRct.ExitCode})`);
    } catch (err) {
      console.warn(`Failed to index ${cid}:`, err);
    }
  }
}

// ---------------------------------------------------------------------------
// Transaction response builder
// ---------------------------------------------------------------------------

function buildTransactionResponse(msg: TrackedMessage): TransactionResponse {
  const totalFee = BigInt(msg.gasFeeCap) * BigInt(msg.gasUsed);
  return {
    amount: msg.value,
    to: toMainnetAddr(msg.to),
    from: toMainnetAddr(msg.from),
    hash: msg.cid,
    timestamp: msg.timestamp,
    height: msg.height,
    type: "message",
    status: msg.exitCode === 0 ? "Ok" : "Fail",
    fee_data: {
      MinerFee: { MinerAddress: "f0100", Amount: totalFee.toString() },
      OverEstimationBurnFee: { BurnAddress: "f099", Amount: "0" },
      BurnFee: { BurnAddress: "f099", Amount: "0" },
      TotalCost: totalFee.toString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Local HTTP proxy server — bridges REST API calls to Lotus RPC
// ---------------------------------------------------------------------------

export const PROXY_PORT = 19234;
export const PROXY_URL = `http://127.0.0.1:${PROXY_PORT}`;

let proxyServer: http.Server | null = null;

async function handleProxy(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PROXY_PORT}`);
  const path = url.pathname.replace(/^\/v2/, "");

  try {
    // GET /v2/addresses/:addr/balance
    const balanceMatch = path.match(/^\/addresses\/([^/]+)\/balance$/);
    if (balanceMatch && req.method === "GET") {
      const addr = toTestnetAddr(balanceMatch[1]);
      const actor = await lotusRpc<{ Balance: string; Nonce: number } | null>(
        "Filecoin.StateGetActor", [addr, []],
      ).catch(() => null);
      const balance = actor?.Balance ?? "0";
      const body: BalanceResponse = { total_balance: balance, spendable_balance: balance, locked_balance: "0" };
      console.log(`[balance] addr=${addr} balance=${balance}`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
      return;
    }

    // GET /v2/network/status
    if (path === "/network/status" && req.method === "GET") {
      const head = await lotusRpc<{ Height: number; Cids: Array<{ "/": string }>; Blocks: Array<{ Timestamp: number }> }>("Filecoin.ChainHead", []);
      const body: NetworkStatusResponse = {
        current_block_identifier: { index: head.Height, hash: head.Cids[0]?.["/"] ?? "" },
        genesis_block_identifier: { index: 0, hash: "" },
        current_block_timestamp: head.Blocks[0]?.Timestamp ?? Math.floor(Date.now() / 1000),
      };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
      return;
    }

    // GET /v2/addresses/:addr/transactions
    const txMatch = path.match(/^\/addresses\/([^/]+)\/transactions$/);
    if (txMatch && req.method === "GET") {
      const address = txMatch[1];
      const fromHeight = parseInt(url.searchParams.get("from_height") ?? "0", 10);
      const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
      const limit = parseInt(url.searchParams.get("limit") ?? "0", 10);

      const addrBody = address.slice(1);
      const relevant = trackedMessages
        .filter(msg => (msg.to.slice(1) === addrBody || msg.from.slice(1) === addrBody) && msg.height >= fromHeight)
        .sort((a, b) => b.height - a.height);

      const sliced = limit > 0 ? relevant.slice(offset, offset + limit) : relevant.slice(offset);
      const txs = sliced.map(buildTransactionResponse);

      const body: TransactionsResponse = { txs, metadata: { limit: limit || txs.length, offset } };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
      return;
    }

    // POST /v2/fees/estimate
    if (path === "/fees/estimate" && req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const reqBody = JSON.parse(Buffer.concat(chunks).toString()) as EstimatedFeesRequest;

      const from = toTestnetAddr(reqBody.from);
      const to = toTestnetAddr(reqBody.to ?? reqBody.from);

      const head = await lotusRpc<{ Cids: Array<{ "/": string }> }>("Filecoin.ChainHead", []);
      const actor = await lotusRpc<{ Nonce: number } | null>("Filecoin.StateGetActor", [from, []]).catch(() => null);
      const nonce = actor?.Nonce ?? 0;

      const estimate = await lotusRpc<{ GasLimit: number; GasFeeCap: string; GasPremium: string }>(
        "Filecoin.GasEstimateMessageGas",
        [
          { To: to, From: from, Value: reqBody.value ?? "0", Method: reqBody.methodNum ?? 0, Params: reqBody.params ?? "", Nonce: nonce, GasLimit: 0, GasFeeCap: "0", GasPremium: "0" },
          { MaxFee: "100000000000000000" },
          head.Cids,
        ],
      );

      // Apply a 2x safety multiplier to gasFeeCap on the devnet to account for
      // base fee fluctuations between estimation and broadcast (fast block times).
      const safeGasFeeCap = (BigInt(estimate.GasFeeCap) * 2n).toString();
      // Also bump gasLimit by 25% for safety
      const safeGasLimit = Math.ceil(estimate.GasLimit * 1.25);

      const body: EstimatedFeesResponse = { gas_limit: safeGasLimit, gas_fee_cap: safeGasFeeCap, gas_premium: estimate.GasPremium, nonce };
      console.log(`[fees] from=${reqBody.from} raw_gasFeeCap=${estimate.GasFeeCap} safe_gasFeeCap=${safeGasFeeCap} gasLimit=${safeGasLimit} nonce=${nonce} estimatedTotal=${BigInt(safeGasFeeCap) * BigInt(safeGasLimit)}`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
      return;
    }

    // POST /v2/transaction/broadcast
    if (path === "/transaction/broadcast" && req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const reqBody = JSON.parse(Buffer.concat(chunks).toString()) as BroadcastTransactionRequest;

      const msg = reqBody.message;
      const totalCost = BigInt(msg.value) + BigInt(msg.gasfeecap) * BigInt(msg.gaslimit);
      // Fetch current balance for comparison
      const fromT = toTestnetAddr(msg.from);
      const actorCheck = await lotusRpc<{ Balance: string } | null>("Filecoin.StateGetActor", [fromT, []]).catch(() => null);
      const currentBalance = BigInt(actorCheck?.Balance ?? "0");
      const deficit = totalCost - currentBalance;
      console.log(`[broadcast] Value=${msg.value} GasFeeCap=${msg.gasfeecap} GasLimit=${msg.gaslimit} totalCost=${totalCost} balance=${currentBalance} deficit=${deficit}`);
      const cidObj = await lotusRpc<{ "/": string }>("Filecoin.MpoolPush", [
        {
          Message: {
            Version: msg.version, To: msg.to, From: msg.from, Nonce: msg.nonce,
            Value: msg.value, GasLimit: msg.gaslimit, GasFeeCap: msg.gasfeecap,
            GasPremium: msg.gaspremium, Method: msg.method, Params: msg.params,
          },
          Signature: { Type: reqBody.signature.type, Data: reqBody.signature.data },
          CID: { "/": "" },
        },
      ]);

      const cid = cidObj["/"];
      pendingCids.push(cid);

      const body: BroadcastTransactionResponse = { hash: cid };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
      return;
    }

    // GET /v2/contract/:addr/address/:ethAddr/balance/erc20
    if (path.includes("/balance/erc20")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: [] } as ERC20BalanceResponse));
      return;
    }

    // GET /v2/addresses/:addr/transactions/erc20
    if (path.includes("/transactions/erc20")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ txs: [] } as FetchERC20TransactionsResponse));
      return;
    }

    res.writeHead(404);
    res.end(`Not found: ${req.method} ${req.url}`);
  } catch (err) {
    console.error(`Proxy error: ${req.method} ${req.url}`, err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: String(err) }));
  }
}

export function startProxy(): Promise<void> {
  return new Promise((resolve, reject) => {
    proxyServer = http.createServer((req, res) => {
      handleProxy(req, res).catch(err => {
        console.error("Proxy handler error:", err);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    });

    proxyServer.listen(PROXY_PORT, "127.0.0.1", () => {
      console.log(`Filecoin proxy listening on ${PROXY_URL}`);
      resolve();
    });

    proxyServer.on("error", reject);
  });
}

export function stopProxy(): void {
  proxyServer?.close();
  proxyServer = null;
}

// ---------------------------------------------------------------------------
// MSW — blocks external calls ONLY (no bridging)
// ---------------------------------------------------------------------------

let mswCleanup: (() => void) | null = null;

export function initMswBlocker(): () => void {
  const server = setupServer(
    mswHttp.get("https://filfox.info/*", () => HttpResponse.json(null, { status: 404 })),
    mswHttp.get("https://crypto-assets-service.api.ledger.com/*", () => HttpResponse.json([])),
    mswHttp.get("https://earn.api.live.ledger.com/*", () => HttpResponse.json([])),
  );

  server.listen({
    onUnhandledRequest: req => {
      const hostname = new URL(req.url).hostname;
      if (["127.0.0.1", "localhost"].includes(hostname)) return;
      throw new Error(`Unhandled external request: ${req.method} ${req.url}`);
    },
  });

  mswCleanup = () => server.close();
  return mswCleanup;
}
