import { http, HttpResponse } from "msw";
import { server } from "../../test/msw";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { craftTransaction } from "../craftTransaction";
import type { BitcoinContext } from "../../api/config";

// craftTransaction rebuilds and re-syncs the account (xpub) over the wire, resolves the fee rate and
// coin-selects the account's UTXOs. This MSW suite exercises that multi-endpoint walk against
// intercepted Ledger explorer v4 routes (endpoint comes from the EXPLORER env).
const EXPLORER = "https://btc-explorer.test.ledger.com";
const BASE = `${EXPLORER}/blockchain/v4/btc`;
const XPUB =
  "xpub6CCc6taSdhLfzELeGNNYXv7BZ7wK8kbzzgcTV9TE7sHyeVo69cq1Mwugt8ZQwtU9xLfSNsLhhuNJfYzb9s2h1ogJugMyTBRBcjpRJXbFDgC";
const RECIPIENT = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
const context = {} as unknown as BitcoinContext;

let prevExplorer: unknown;
beforeAll(() => {
  prevExplorer = getEnv("EXPLORER");
  setEnv("EXPLORER", EXPLORER);
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  setEnv("EXPLORER", prevExplorer as string);
});

const pristineHandlers = () => [
  http.get(`${BASE}/block/current`, () =>
    HttpResponse.json({ height: 800_000, hash: "0000abc", time: "2024-06-01T00:00:00Z" }),
  ),
  http.get(`${BASE}/block/:height`, () =>
    HttpResponse.json([{ height: 800_000, hash: "0000abc", time: "2024-06-01T00:00:00Z" }]),
  ),
  http.get(`${BASE}/address/:address/txs`, () => HttpResponse.json({ data: [], token: null })),
  http.get(`${BASE}/address/:address/txs/pending`, () => HttpResponse.json([])),
  http.get(`${BASE}/fees`, () =>
    HttpResponse.json({ "2": 2000, "3": 1500, "6": 1000, last_updated: 1 }),
  ),
  http.get(`${BASE}/network`, () => HttpResponse.json({})),
];

const asIntent = (o: Record<string, unknown>) =>
  o as unknown as Parameters<typeof craftTransaction>[2];

describe("logic/craftTransaction (MSW)", () => {
  it("rejects when the account (pristine xpub) has no UTXOs to spend", async () => {
    server.use(...pristineHandlers());

    await expect(
      craftTransaction(
        context,
        "bitcoin",
        asIntent({
          sender: XPUB,
          recipient: RECIPIENT,
          amount: 100_000n,
          senderDerivationPath: "84'/0'/0'",
        }),
        undefined,
      ),
    ).rejects.toThrow(/not enough|balance|utxo|fund/i);
  });
});
