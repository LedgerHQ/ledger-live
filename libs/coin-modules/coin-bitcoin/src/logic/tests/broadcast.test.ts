import { http, HttpResponse } from "msw";
import { server } from "../../test/msw";
import { broadcast } from "../broadcast";
import type { BitcoinContext } from "../../api/config";

const BASE = "https://btc-explorer.test.ledger.com/blockchain/v4/btc";
const context = {
  config: async () => ({ status: { type: "active" }, explorer: { uri: BASE } }),
} as unknown as BitcoinContext;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("logic/broadcast (MSW)", () => {
  it("POSTs the raw tx to /tx/send and returns the explorer-reported txid", async () => {
    server.use(http.post(`${BASE}/tx/send`, () => HttpResponse.json({ result: "txid-789" })));

    expect(await broadcast(context, "bitcoin", "rawtxhex")).toBe("txid-789");
  });

  it("throws when the explorer response carries no txid", async () => {
    // logic/broadcast treats an empty result as a failure (a HTTP 200 with no id must not look ok).
    server.use(http.post(`${BASE}/tx/send`, () => HttpResponse.json({})));

    await expect(broadcast(context, "bitcoin", "rawtxhex")).rejects.toThrow(/empty transaction id/);
  });
});
