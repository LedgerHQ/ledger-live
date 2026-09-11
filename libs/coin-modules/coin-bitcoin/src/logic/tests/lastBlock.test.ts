import { http, HttpResponse } from "msw";
import { server } from "../../test/msw";
import { lastBlock } from "../lastBlock";
import type { BitcoinContext } from "../../api/config";

// The Alpaca network layer builds its explorer from `config.explorer.uri`, so we point it at a fake
// host and let MSW intercept the exact Ledger explorer v4 route.
const BASE = "https://btc-explorer.test.ledger.com/blockchain/v4/btc";
const context = {
  config: async () => ({ status: { type: "active" }, explorer: { uri: BASE } }),
} as unknown as BitcoinContext;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("logic/lastBlock (MSW)", () => {
  it("maps the explorer's current block to a BlockInfo with a Date time", async () => {
    server.use(
      http.get(`${BASE}/block/current`, () =>
        HttpResponse.json({ height: 800_000, hash: "0000cafe", time: "2024-06-01T00:00:00Z" }),
      ),
    );

    const info = await lastBlock(context, "bitcoin");

    expect(info.height).toBe(800_000);
    expect(info.hash).toBe("0000cafe");
    expect(info.time).toBeInstanceOf(Date);
    expect(info.time.toISOString()).toBe("2024-06-01T00:00:00.000Z");
  });

  it("throws when the explorer reports no current block", async () => {
    server.use(http.get(`${BASE}/block/current`, () => HttpResponse.json(null)));

    await expect(lastBlock(context, "bitcoin")).rejects.toThrow(/no current block/);
  });
});
