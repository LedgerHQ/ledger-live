import { http, HttpResponse } from "msw";
import { server } from "../test/msw";
import { getCurrentBlock, getFees, broadcastTx } from "./index";
import type { BitcoinCoinConfig } from "../api/config";

// The Alpaca network layer builds its explorer from `config.explorer.uri` when present, so we point
// it at a fake host and let MSW intercept the exact Ledger explorer v4 routes wallet-btc calls. No
// env/setup file needed (unlike coin-kaspa, whose endpoint comes from `setEnv`).
const BASE = "https://btc-explorer.test.ledger.com/blockchain/v4/btc";
const config = { explorer: { uri: BASE } } as unknown as BitcoinCoinConfig;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("network/getCurrentBlock (MSW)", () => {
  it("maps the /block/current response to a Block", async () => {
    server.use(
      http.get(`${BASE}/block/current`, () =>
        HttpResponse.json({ height: 800_000, hash: "0000cafe", time: "2024-06-01T00:00:00Z" }),
      ),
    );

    const block = await getCurrentBlock("bitcoin", config);

    expect(block).toEqual({ height: 800_000, hash: "0000cafe", time: "2024-06-01T00:00:00Z" });
  });

  it("returns null when the explorer reports no current block", async () => {
    server.use(http.get(`${BASE}/block/current`, () => HttpResponse.json(null)));

    expect(await getCurrentBlock("bitcoin", config)).toBeNull();
  });
});

describe("network/getFees (MSW)", () => {
  it("returns the explorer fee-rate map keyed by confirmation target", async () => {
    server.use(
      http.get(`${BASE}/fees`, () =>
        HttpResponse.json({ "2": 2435, "3": 1241, "6": 1009, last_updated: 1_717_200_000 }),
      ),
    );

    const fees = await getFees("bitcoin", config);

    expect(fees["2"]).toBe(2435);
    expect(fees["6"]).toBe(1009);
  });
});

describe("network/broadcastTx (MSW)", () => {
  it("POSTs to /tx/send and returns the explorer-reported txid", async () => {
    server.use(http.post(`${BASE}/tx/send`, () => HttpResponse.json({ result: "txid-789" })));

    expect(await broadcastTx("bitcoin", "rawtxhex", config)).toBe("txid-789");
  });

  it("returns an empty string when the explorer response carries no result", async () => {
    // The wrapper's `?? ""` fallback — callers (logic/broadcast) treat "" as a failure and throw.
    server.use(http.post(`${BASE}/tx/send`, () => HttpResponse.json({})));

    expect(await broadcastTx("bitcoin", "rawtxhex", config)).toBe("");
  });

  it("forwards the broadcast source as X-Ledger-Source headers", async () => {
    let captured: { type: string | null; name: string | null } = { type: null, name: null };
    server.use(
      http.post(`${BASE}/tx/send`, ({ request }) => {
        captured = {
          type: request.headers.get("X-Ledger-Source-Type"),
          name: request.headers.get("X-Ledger-Source-Name"),
        };
        return HttpResponse.json({ result: "txid-hdr" });
      }),
    );

    await broadcastTx("bitcoin", "rawtxhex", config, {
      source: { type: "coin-module", name: "test-name" },
    });

    expect(captured).toEqual({ type: "coin-module", name: "test-name" });
  });
});
