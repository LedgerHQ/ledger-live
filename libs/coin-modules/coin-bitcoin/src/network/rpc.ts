import network from "@ledgerhq/live-network/network";
import type cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { TX } from "@ledgerhq/wallet-btc/storage/types";

/**
 * Shared batched-`/rpc` transport for the coin-bitcoin Alpaca surface.
 *
 * The Ledger explorer exposes a JSON-RPC 2.0 endpoint (`POST /rpc`) that accepts a BATCH (array of
 * calls, up to ~500) — collapsing N per-address queries into one HTTP round-trip. Explorers without
 * it (e.g. the regtest indexer) answer `/rpc` with 404, so every batch transparently falls back to
 * the per-address REST routes. The transport decision is made on the first call and remembered for
 * the rest of a given operation (a local `Transport` object — never module state).
 */

export const CHUNK = 200; // max JSON-RPC calls per POST (endpoint tolerates 500)

/** Transport capability, decided once per operation (local — not module state). */
export type Transport = { rpc?: boolean };

export type RpcCall = { method: string; params: unknown[] };

export function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const isNotFound = (e: unknown): boolean => {
  const status =
    (e as { status?: number; response?: { status?: number } })?.status ??
    (e as { response?: { status?: number } })?.response?.status;
  return status === 404 || /\b404\b/.test(String((e as { message?: string })?.message ?? e ?? ""));
};

/** REST equivalent of a single JSON-RPC call, for explorers without `/rpc` (e.g. regtest). */
async function restEquivalent(base: string, call: RpcCall): Promise<unknown> {
  const p = (
    typeof call.params[0] === "string" ? { address: call.params[0] } : call.params[0]
  ) as Record<string, unknown>;
  const address = p.address as string;

  if (call.method === "atlas_getTxsPending") {
    const { data } = await network<{ data?: TX[] } | TX[]>({
      method: "GET",
      url: `${base}/address/${address}/txs/pending`,
      params: { verbosity: p.verbosity },
    });
    return { data: (Array.isArray(data) ? data : (data?.data ?? [])) as TX[] };
  }

  if (call.method === "atlas_getBalance") {
    // Precise: the REST endpoint returns the confirmed balance as a decimal string.
    const { data } = await network<{ balance?: string }>({
      method: "GET",
      url: `${base}/address/${address}/balance`,
    });
    return data?.balance ?? "0";
  }

  // atlas_getTxs → GET address/{a}/txs (same params; `limit` maps to `batch_size`)
  const params: Record<string, unknown> = {};
  for (const k of [
    "verbosity",
    "order",
    "to_height",
    "from_height",
    "batch_size",
    "token",
  ] as const) {
    if (p[k] !== undefined) params[k] = p[k];
  }
  if (p.limit !== undefined) params.batch_size = p.limit;
  const { data } = await network<{ data?: TX[]; token?: string }>({
    method: "GET",
    url: `${base}/address/${address}/txs`,
    params,
  });
  const result: { data: TX[]; token?: string } = { data: (data?.data ?? []) as TX[] };
  if (data?.token) result.token = data.token;
  return result;
}

/**
 * One batched request: a single `POST /rpc` when supported, else a per-address REST fan-out.
 * Returns each call's `result` aligned to `calls` (undefined for a per-call error). Callers cast the
 * result to the shape their method returns (`{ data, token }` for txs, a balance number/string, …).
 */
export async function rpcBatch(base: string, calls: RpcCall[], t: Transport): Promise<unknown[]> {
  if (calls.length === 0) return [];
  if (t.rpc !== false) {
    try {
      const body = calls.map((c, id) => ({
        id,
        jsonrpc: "2.0",
        method: c.method,
        params: c.params,
      }));
      const { data } = await network<{ id: number; result?: unknown; error?: unknown }[]>({
        method: "POST",
        url: `${base}/rpc`,
        data: body,
      });
      t.rpc = true;
      const byId = new Map<number, unknown>();
      for (const r of data) byId.set(r.id, r.error ? undefined : r.result);
      return calls.map((_, id) => byId.get(id));
    } catch (e) {
      if (!isNotFound(e)) throw e;
      t.rpc = false; // explorer has no /rpc — fall back to per-address REST for the rest of this op
    }
  }
  return Promise.all(calls.map(c => restEquivalent(base, c)));
}

/**
 * Batched gap-limit discovery for one chain (0 = receive, 1 = change). Returns the horizon size
 * (last used index + gap), probing a window of addresses per POST with `atlas_getTxs(limit=1)`.
 */
export async function discoverHorizon(
  base: string,
  crypto: ReturnType<typeof cryptoFactory>,
  derivationMode: string,
  xpub: string,
  chain: number,
  t: Transport,
): Promise<number> {
  const GAP = 20;
  const WINDOW = 200;
  let index = 0;
  while (index < 100_000) {
    const addrs = await Promise.all(
      Array.from({ length: WINDOW }, (_, i) =>
        crypto.getAddress(derivationMode, xpub, chain, index + i),
      ),
    );
    const present: boolean[] = [];
    for (const group of chunk(addrs, CHUNK)) {
      const res = await rpcBatch(
        base,
        group.map(address => ({
          method: "atlas_getTxs",
          params: [{ address, verbosity: "Minimal", order: "descending", limit: 1 }],
        })),
        t,
      );
      res.forEach(r => present.push(((r as { data?: TX[] })?.data?.length ?? 0) > 0));
    }
    let lastActive = -1;
    present.forEach((p, i) => {
      if (p) lastActive = i;
    });
    if (WINDOW - 1 - lastActive >= GAP) return index + lastActive + 1 + GAP; // last used + gap
    index += WINDOW;
  }
  return index;
}
