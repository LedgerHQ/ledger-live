import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  SIMULATOR_URL,
  generateBlocks,
  generateBlocksUntilTxProcessed,
  simulatorGet,
} from "./chainSimulator";
import { MULTIVERSX_API_URL, MULTIVERSX_DELEGATION_API_URL } from "./fixtures";

/**
 * Indexer bridging the api.multiversx.com-style aggregator API (what coin-multiversx
 * calls) onto the local chain simulator's gateway/proxy API.
 *
 * Reads (balance, nonce, tokens, network config) are proxied/translated live from
 * the simulator. The aggregator's transaction-history endpoints have no gateway
 * equivalent, so this module tracks every transaction it broadcasts and serves it
 * back in the aggregator's shape — the same "local indexer" pattern as the EVM and
 * Tezos coin testers.
 */

interface TrackedTx {
  txHash: string;
  sender: string;
  receiver: string;
  value: string;
  fee: string;
  status: string;
  round: number;
  miniBlockHash: string;
  timestamp: number;
  nonce: number;
  gasLimit: number;
  data?: string;
  /** Set when the tx is an ESDTTransfer; identifies the token sub-account history. */
  esdtIdentifier?: string;
  /** Decoded ESDT amount (decimal string) for the token sub-account operation value. */
  tokenValue?: string;
}

let trackedTxs: TrackedTx[] = [];

export function resetIndexer(): void {
  trackedTxs = [];
}

// --- Gateway response shapes (subset we read) ---
interface GatewayAccountResponse {
  data: { account: { address: string; nonce: number; balance: string } };
}
interface GatewayNetworkStatusResponse {
  data: { status: { erd_nonce: number; erd_current_round: number } };
}
interface GatewayEsdtResponse {
  data: { esdts: Record<string, { tokenIdentifier?: string; balance: string }> };
}
interface GatewayTxResponse {
  data: {
    transaction: {
      sender: string;
      receiver: string;
      value: string;
      nonce: number;
      round: number;
      miniblockHash?: string;
      timestamp: number;
      status: string;
      fee?: string;
      data?: string;
      gasLimit?: number;
    };
  };
}
interface GatewaySendResponse {
  data: { txHash: string };
}

/** Decode an `ESDTTransfer@<tokenHex>@<amountHex>` data payload (base64) if present. */
function decodeEsdtTransfer(dataBase64?: string): { identifier: string; value: string } | null {
  if (!dataBase64) return null;
  const decoded = Buffer.from(dataBase64, "base64").toString("utf8");
  if (!decoded.startsWith("ESDTTransfer@")) return null;
  const [, tokenHex, amountHex] = decoded.split("@");
  if (!tokenHex || !amountHex) return null;
  const identifier = Buffer.from(tokenHex, "hex").toString("utf8");
  const value = BigInt(`0x${amountHex}`).toString();
  return { identifier, value };
}

/** Fetch a processed transaction, advancing blocks (bounded) until it reaches a final status. */
async function fetchFinalizedTx(
  txHash: string,
): Promise<GatewayTxResponse["data"]["transaction"] | undefined> {
  // Bounded, deterministic settle: each attempt advances blocks (handles cross-shard
  // txs that stay "pending" for a few rounds). Not a wall-clock poll loop.
  for (let attempt = 0; attempt < 8; attempt++) {
    const processed = await simulatorGet<GatewayTxResponse>(
      `/transaction/${txHash}?withResults=true`,
    );
    const tx = processed?.data.transaction;
    if (tx && tx.status && tx.status !== "pending") return tx;
    await generateBlocks(2);
  }
  const last = await simulatorGet<GatewayTxResponse>(`/transaction/${txHash}?withResults=true`);
  return last?.data.transaction;
}

/** Record a broadcast transaction (after it is processed on-chain) so history endpoints can serve it. */
async function trackBroadcastTx(txHash: string): Promise<void> {
  const tx = await fetchFinalizedTx(txHash);
  if (!tx) return;

  const esdt = decodeEsdtTransfer(tx.data);

  trackedTxs.push({
    txHash,
    sender: tx.sender,
    receiver: tx.receiver,
    value: tx.value ?? "0",
    fee: tx.fee ?? "0",
    status: tx.status ?? "success",
    round: tx.round ?? 0,
    miniBlockHash: tx.miniblockHash ?? "",
    timestamp: tx.timestamp,
    nonce: tx.nonce ?? 0,
    gasLimit: tx.gasLimit ?? 0,
    data: tx.data,
    esdtIdentifier: esdt?.identifier,
    tokenValue: esdt?.value,
  });
}

/** Build an aggregator-shaped transaction object from a tracked tx. */
function toApiTransaction(tx: TrackedTx): Record<string, unknown> {
  // For ESDT transfers the aggregator exposes a decoded `action`; the coin module's
  // operation mapper reads the transferred amount from `action.arguments.transfers`.
  const action =
    tx.esdtIdentifier && tx.tokenValue
      ? {
          category: "esdt",
          name: "transfer",
          arguments: { transfers: [{ token: tx.esdtIdentifier, value: tx.tokenValue }] },
        }
      : undefined;

  return {
    txHash: tx.txHash,
    sender: tx.sender,
    receiver: tx.receiver,
    value: tx.value,
    fee: tx.fee,
    status: tx.status,
    round: tx.round,
    miniBlockHash: tx.miniBlockHash,
    timestamp: tx.timestamp,
    nonce: tx.nonce,
    gasLimit: tx.gasLimit,
    ...(tx.data ? { data: tx.data } : {}),
    ...(tx.tokenValue ? { tokenValue: tx.tokenValue } : {}),
    ...(action ? { action } : {}),
  };
}

function txsForAddress(address: string, after: number): TrackedTx[] {
  return trackedTxs.filter(
    tx => (tx.sender === address || tx.receiver === address) && tx.timestamp >= after,
  );
}

function esdtTxsForAddress(address: string, token: string, after: number): TrackedTx[] {
  return txsForAddress(address, after).filter(tx => tx.esdtIdentifier === token);
}

/**
 * Start the MSW server intercepting the MultiversX aggregator + delegation hosts.
 * Unhandled requests to the local simulator pass through; anything else throws.
 * Returns a cleanup function.
 */
export function initMswHandlers(): () => void {
  const server = setupServer(
    // --- Account balance + nonce (used by both apiCalls and sdk-core ApiNetworkProvider) ---
    http.get(`${MULTIVERSX_API_URL}/accounts/:address`, async ({ params }) => {
      const address = params.address as string;
      const res = await simulatorGet<GatewayAccountResponse>(`/address/${address}`);
      const account = res?.data.account;
      return HttpResponse.json({
        address,
        balance: account?.balance ?? "0",
        nonce: account?.nonce ?? 0,
        isGuarded: false,
      });
    }),

    // --- EGLD transaction history ---
    http.get(
      `${MULTIVERSX_API_URL}/accounts/:address/transactions/count`,
      ({ params, request }) => {
        const address = params.address as string;
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        const after = Number(url.searchParams.get("after") ?? "0");
        const list = token
          ? esdtTxsForAddress(address, token, after)
          : txsForAddress(address, after);
        return HttpResponse.json(list.length);
      },
    ),

    http.get(`${MULTIVERSX_API_URL}/accounts/:address/transactions`, ({ params, request }) => {
      const address = params.address as string;
      const url = new URL(request.url);
      const token = url.searchParams.get("token");
      const after = Number(url.searchParams.get("after") ?? "0");
      const from = Number(url.searchParams.get("from") ?? "0");
      const size = Number(url.searchParams.get("size") ?? "50");
      const list = token ? esdtTxsForAddress(address, token, after) : txsForAddress(address, after);
      const page = list.slice(from, from + size).map(toApiTransaction);
      return HttpResponse.json(page);
    }),

    // --- Unified transfers stream (native EGLD + ESDT), used by listOperations ---
    // Windows by timestamp (`before`/`after`, both inclusive), ordered `asc`/`desc`
    // with txHash as tiebreaker, then paginated with `from`/`size`.
    http.get(`${MULTIVERSX_API_URL}/accounts/:address/transfers`, ({ params, request }) => {
      const address = params.address as string;
      const url = new URL(request.url);
      const from = Number(url.searchParams.get("from") ?? "0");
      const size = Number(url.searchParams.get("size") ?? "50");
      const order = url.searchParams.get("order") === "asc" ? "asc" : "desc";
      const before = url.searchParams.get("before");
      const after = url.searchParams.get("after");

      let list = trackedTxs.filter(tx => tx.sender === address || tx.receiver === address);
      if (before !== null) list = list.filter(tx => tx.timestamp <= Number(before));
      if (after !== null) list = list.filter(tx => tx.timestamp >= Number(after));

      const sorted = [...list].sort((a, b) =>
        a.timestamp !== b.timestamp
          ? order === "asc"
            ? a.timestamp - b.timestamp
            : b.timestamp - a.timestamp
          : a.txHash.localeCompare(b.txHash),
      );

      const page = sorted.slice(from, from + size).map(toApiTransaction);
      return HttpResponse.json(page);
    }),

    // --- ESDT token balances ---
    http.get(`${MULTIVERSX_API_URL}/accounts/:address/tokens/count`, async ({ params }) => {
      const address = params.address as string;
      const res = await simulatorGet<GatewayEsdtResponse>(`/address/${address}/esdt`);
      const esdts = res?.data.esdts ?? {};
      return HttpResponse.json(Object.keys(esdts).length);
    }),

    http.get(`${MULTIVERSX_API_URL}/accounts/:address/tokens`, async ({ params, request }) => {
      const address = params.address as string;
      const url = new URL(request.url);
      const from = Number(url.searchParams.get("from") ?? "0");
      const size = Number(url.searchParams.get("size") ?? "50");
      const res = await simulatorGet<GatewayEsdtResponse>(`/address/${address}/esdt`);
      const esdts = res?.data.esdts ?? {};
      const tokens = Object.values(esdts)
        .map(e => {
          const identifier = e.tokenIdentifier ?? "";
          return { identifier, name: identifier.split("-")[0], balance: e.balance };
        })
        .slice(from, from + size);
      return HttpResponse.json(tokens);
    }),

    // --- Block height (metachain round) ---
    http.get(`${MULTIVERSX_API_URL}/blocks`, async () => {
      const res = await simulatorGet<GatewayNetworkStatusResponse>("/network/status/4294967295");
      const round = res?.data.status.erd_nonce ?? res?.data.status.erd_current_round ?? 0;
      return HttpResponse.json([{ round }]);
    }),

    // --- Network config: gateway shape matches the aggregator's, proxy straight through ---
    http.get(`${MULTIVERSX_API_URL}/network/config`, async () => {
      const res = await simulatorGet<Record<string, unknown>>("/network/config");
      return HttpResponse.json(res ?? {});
    }),

    // --- Broadcast: forward to the simulator, mine the tx, then index it ---
    http.post(`${MULTIVERSX_API_URL}/transaction/send`, async ({ request }) => {
      const body = await request.json();
      const sendRes = await fetch(`${SIMULATOR_URL}/transaction/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await sendRes.json()) as GatewaySendResponse & { error?: string };
      const txHash = json?.data?.txHash;
      if (!txHash) {
        // Surface a rejected submission instead of silently returning an empty hash.
        throw new Error(`transaction/send rejected by simulator: ${JSON.stringify(json)}`);
      }
      // Deterministic inclusion: advance blocks until the tx is processed, then index it.
      await generateBlocksUntilTxProcessed(txHash);
      await trackBroadcastTx(txHash);
      return HttpResponse.json({ data: { txHash } });
    }),

    // --- Delegation API: no staking in this tester ---
    http.get(`${MULTIVERSX_DELEGATION_API_URL}/providers`, () => HttpResponse.json([])),
    http.get(`${MULTIVERSX_DELEGATION_API_URL}/accounts/:address/delegations`, () =>
      HttpResponse.json([]),
    ),
  );

  server.listen({
    onUnhandledRequest: request => {
      const hostname = new URL(request.url).hostname;
      // Allow requests to the local simulator to pass through to the real node.
      if (["127.0.0.1", "localhost"].includes(hostname)) return;
      throw new Error(`Unhandled request: ${request.method} ${request.url}`);
    },
  });

  return () => server.close();
}
