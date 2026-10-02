import { http, HttpResponse } from "msw";
import { server } from "../../test/msw";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { Currency } from "@ledgerhq/wallet-btc/crypto/types";
import { listOperations } from "../listOperations";
import { deriveAccountMeta } from "../buildAccount";
import type { BitcoinContext } from "../../api/config";

const EXPLORER = "https://btc-explorer.test.ledger.com";
const BASE = `${EXPLORER}/blockchain/v4/btc`;
const XPUB =
  "xpub6CCc6taSdhLfzELeGNNYXv7BZ7wK8kbzzgcTV9TE7sHyeVo69cq1Mwugt8ZQwtU9xLfSNsLhhuNJfYzb9s2h1ogJugMyTBRBcjpRJXbFDgC";
const DPATH = "84'/0'/0'";
const context = {
  config: async () => ({ status: { type: "active" } }),
} as unknown as BitcoinContext;

let prevExplorer: unknown;
let R0: string; // receive 0
let R1: string; // receive 1
let C0: string; // change 0

beforeAll(async () => {
  prevExplorer = getEnv("EXPLORER");
  setEnv("EXPLORER", EXPLORER);
  server.listen({ onUnhandledRequest: "error" });
  const { derivationMode } = deriveAccountMeta(DPATH);
  const crypto = cryptoFactory("bitcoin" as unknown as Currency);
  R0 = await crypto.getAddress(derivationMode, XPUB, 0, 0);
  R1 = await crypto.getAddress(derivationMode, XPUB, 0, 1);
  C0 = await crypto.getAddress(derivationMode, XPUB, 1, 0);
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  setEnv("EXPLORER", prevExplorer as string);
});

// --- fixtures ---
type Tx = Record<string, unknown>;
const inTx = (hash: string, height: number | null, address: string): Tx => ({
  id: hash,
  hash,
  received_at: "2024-01-01T00:00:00Z",
  block: height === null ? null : { height, hash: `b${height}`, time: "2024-01-01T00:00:00Z" },
  inputs: [
    { value: "500000", address: "external", output_hash: "p", output_index: 0, sequence: 0 },
  ],
  outputs: [{ value: "40000", address, output_hash: hash, output_index: 0, rbf: false }],
  fees: 1000,
});

// Address-keyed fake `/rpc`; honors order / height bounds / limit.
const fakeExplorer = (
  txsByAddr: Record<string, Tx[]>,
  pendingByAddr: Record<string, Tx[]> = {},
  base = BASE,
) =>
  http.post(`${base}/rpc`, async ({ request }) => {
    const body = (await request.json()) as { id: number; method: string; params: unknown[] }[];
    return HttpResponse.json(
      body.map(call => {
        const p = (
          typeof call.params[0] === "string" ? { address: call.params[0] } : call.params[0]
        ) as Record<string, unknown>;
        const address = p.address as string;
        if (call.method === "atlas_getTxsPending") {
          return { id: call.id, jsonrpc: "2.0", result: { data: pendingByAddr[address] ?? [] } };
        }
        let txs = [...(txsByAddr[address] ?? [])];
        const toHeight = p.to_height as number | undefined;
        const fromHeight = p.from_height as number | undefined;
        const lim = (p.limit ?? p.batch_size) as number | undefined;
        if (toHeight !== undefined)
          txs = txs.filter(t => (t.block as { height: number }).height <= toHeight);
        if (fromHeight !== undefined)
          txs = txs.filter(t => (t.block as { height: number }).height >= fromHeight);
        txs.sort((a, b) => {
          const ha = (a.block as { height: number }).height;
          const hb = (b.block as { height: number }).height;
          return p.order === "ascending" ? ha - hb : hb - ha;
        });
        if (lim !== undefined) txs = txs.slice(0, lim);
        return { id: call.id, jsonrpc: "2.0", result: { data: txs, token: null } };
      }),
    );
  });

describe("logic/listOperations (MSW)", () => {
  it("returns an empty, cursor-less page for a pristine xpub (no operations)", async () => {
    server.use(fakeExplorer({}, {}));
    const page = await listOperations(context, "bitcoin", XPUB, {
      minHeight: 0,
      derivationPath: DPATH,
    });
    expect(page.items).toEqual([]);
    expect(page.next).toBeUndefined();
  });

  it("falls back to per-address REST when the explorer has no /rpc endpoint (e.g. regtest)", async () => {
    server.use(
      http.post(`${BASE}/rpc`, () => new HttpResponse("not found", { status: 404 })),
      http.get(`${BASE}/address/:address/txs`, () => HttpResponse.json({ data: [], token: null })),
      http.get(`${BASE}/address/:address/txs/pending`, () => HttpResponse.json([])),
    );
    const page = await listOperations(context, "bitcoin", XPUB, {
      minHeight: 0,
      derivationPath: DPATH,
    });
    expect(page.items).toEqual([]);
    expect(page.next).toBeUndefined();
  });

  it("honors config.explorer.uri over the EXPLORER env (A1)", async () => {
    const CONFIG_BASE = "https://config-explorer.test.ledger.com/blockchain/v4/btc";
    // Only the config base is registered; using the env base would hit an unhandled request and fail.
    server.use(fakeExplorer({ [R0]: [inTx("txcfg", 100, R0)] }, {}, CONFIG_BASE));
    const ctx = {
      config: async () => ({ status: { type: "active" }, explorer: { uri: CONFIG_BASE } }),
    } as unknown as BitcoinContext;

    const page = await listOperations(ctx, "bitcoin", XPUB, {
      minHeight: 0,
      derivationPath: DPATH,
    });
    expect(page.items.map(o => o.id)).toEqual(["txcfg-IN"]);
  });

  it("paginates ascending without stalling and reconstructs the full history (A2)", async () => {
    // 5 confirmed ops across two addresses at heights 100..500.
    server.use(
      fakeExplorer({
        [R0]: [inTx("t100", 100, R0), inTx("t300", 300, R0), inTx("t500", 500, R0)],
        [R1]: [inTx("t200", 200, R1), inTx("t400", 400, R1)],
      }),
    );

    const ids: string[] = [];
    let cursor: string | undefined;
    let pages = 0;
    do {
      pages += 1;
      const page = await listOperations(context, "bitcoin", XPUB, {
        minHeight: 0,
        derivationPath: DPATH,
        order: "asc",
        limit: 2,
        cursor,
      });
      ids.push(...page.items.map(o => o.id));
      cursor = page.next;
    } while (cursor !== undefined && pages < 10);

    // ascending by height, all 5, no loop
    expect(ids).toEqual(["t100-IN", "t200-IN", "t300-IN", "t400-IN", "t500-IN"]);
    expect(pages).toBeLessThan(6);
  });

  it("puts all pending on page 1 with a confirmed-based cursor that does not stall page 2 (A3)", async () => {
    // 3 pending + 4 confirmed. Page size 2.
    server.use(
      fakeExplorer(
        {
          [R0]: [inTx("c100", 100, R0), inTx("c300", 300, R0)],
          [R1]: [inTx("c200", 200, R1), inTx("c400", 400, R1)],
        },
        { [R0]: [inTx("p1", null, R0), inTx("p2", null, R0)], [R1]: [inTx("p3", null, R1)] },
      ),
    );

    const p1 = await listOperations(context, "bitcoin", XPUB, {
      minHeight: 0,
      derivationPath: DPATH,
      order: "desc",
      limit: 2,
    });
    // all 3 pending on top, then the 2 newest confirmed
    const pendingIds = p1.items.filter(o => o.tx.block.height === 0).map(o => o.id);
    expect(pendingIds.sort()).toEqual(["p1-IN", "p2-IN", "p3-IN"]);
    expect(p1.items.filter(o => o.tx.block.height > 0).map(o => o.id)).toEqual([
      "c400-IN",
      "c300-IN",
    ]);
    // cursor tracks a CONFIRMED height (never 0)
    expect(p1.next).toBeDefined();
    expect(JSON.parse(p1.next as string).height).toBeGreaterThan(0);

    // page 2 continues confirmed (does NOT return empty)
    const p2 = await listOperations(context, "bitcoin", XPUB, {
      minHeight: 0,
      derivationPath: DPATH,
      order: "desc",
      limit: 2,
      cursor: p1.next,
    });
    expect(p2.items.map(o => o.id)).toEqual(["c200-IN", "c100-IN"]);
    // p2 was a full page (2 ops) → ADR-061: a cursor is returned; page 3 confirms exhaustion (empty).
    expect(p2.next).toBeDefined();
    const p3 = await listOperations(context, "bitcoin", XPUB, {
      minHeight: 0,
      derivationPath: DPATH,
      order: "desc",
      limit: 2,
      cursor: p2.next,
    });
    expect(p3.items).toEqual([]);
    expect(p3.next).toBeUndefined();
  });

  it("returns exact account-wide operations (equality fixture: value/type/recipients/senders)", async () => {
    // R0 receives 40000 at h300; R1 receives 40000 at h100. Two derived addresses → account-wide.
    server.use(fakeExplorer({ [R0]: [inTx("rxA", 300, R0)], [R1]: [inTx("rxB", 100, R1)] }));

    const page = await listOperations(context, "bitcoin", XPUB, {
      minHeight: 0,
      derivationPath: DPATH,
      order: "desc",
    });

    expect(page.items).toEqual([
      {
        id: "rxA-IN",
        type: "IN",
        senders: ["external"],
        recipients: [R0],
        value: 40000n,
        asset: { type: "native" },
        tx: {
          hash: "rxA",
          block: { height: 300, hash: "b300", time: new Date("2024-01-01T00:00:00Z") },
          fees: 1000n,
          date: new Date("2024-01-01T00:00:00Z"),
          failed: false,
        },
      },
      {
        id: "rxB-IN",
        type: "IN",
        senders: ["external"],
        recipients: [R1],
        value: 40000n,
        asset: { type: "native" },
        tx: {
          hash: "rxB",
          block: { height: 100, hash: "b100", time: new Date("2024-01-01T00:00:00Z") },
          fees: 1000n,
          date: new Date("2024-01-01T00:00:00Z"),
          failed: false,
        },
      },
    ]);
    expect(page.next).toBeUndefined();
  });

  it("surfaces a just-sent (pending) OUT above confirmed history over the /rpc→REST fallback (regtest post-send)", async () => {
    // The generic-adapter coin-tester post-send state: a confirmed funding IN + a pending (0-conf) spend,
    // over the regtest REST fallback (no /rpc).
    const DEST = "bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97"; // external, not derived

    const fund = {
      id: "fund0",
      hash: "fund0",
      received_at: "2024-06-01T00:00:00Z",
      block: { height: 799_000, hash: "b799000", time: "2024-06-01T00:00:00Z" },
      inputs: [
        { value: "100000", address: "external", output_hash: "prev", output_index: 0, sequence: 0 },
      ],
      outputs: [{ value: "100000", address: R0, output_hash: "fund0", output_index: 0 }],
      fees: 500,
    };
    // Pending spend of R0's UTXO: 50000 to an external dest, 49000 change back to C0 (a change address).
    const pendingSpend = {
      id: "spend",
      hash: "spend",
      received_at: "2024-06-02T00:00:00Z",
      block: null,
      inputs: [
        { value: "100000", address: R0, output_hash: "fund0", output_index: 0, sequence: 0 },
      ],
      outputs: [
        { value: "50000", address: DEST, output_hash: "spend", output_index: 0 },
        { value: "49000", address: C0, output_hash: "spend", output_index: 1 },
      ],
      fees: 1000,
    };

    server.use(
      http.post(`${BASE}/rpc`, () => new HttpResponse("not found", { status: 404 })),
      http.get(`${BASE}/address/:address/txs`, ({ params }) =>
        HttpResponse.json(
          params.address === R0 ? { data: [fund], token: null } : { data: [], token: null },
        ),
      ),
      // Pending endpoint returns a bare array (wallet-btc convention); the spend is indexed under its input R0.
      http.get(`${BASE}/address/:address/txs/pending`, ({ params }) =>
        HttpResponse.json(params.address === R0 ? [pendingSpend] : []),
      ),
    );

    const page = await listOperations(context, "bitcoin", XPUB, {
      minHeight: 0,
      derivationPath: DPATH,
      order: "desc",
    });

    // Pending OUT on top (height 0), then the confirmed funding IN.
    expect(page.items.map(o => o.id)).toEqual(["spend-OUT", "fund0-IN"]);

    const [out, incoming] = page.items;
    expect(out.type).toBe("OUT");
    expect(out.tx.block.height).toBe(0); // pending
    expect(out.value).toBe(50000n); // fee-excluded amount to the external recipient (change excluded)
    expect(out.recipients).toEqual([DEST]);

    expect(incoming.type).toBe("IN");
    expect(incoming.tx.block.height).toBe(799_000);
    expect(incoming.value).toBe(100000n);
    expect(incoming.recipients).toEqual([R0]);
  });
});
