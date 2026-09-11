import { http, HttpResponse } from "msw";
import { server } from "../../test/msw";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { estimateFees } from "../estimateFees";
import type { BitcoinContext } from "../../api/config";

// estimateFees rebuilds and re-syncs the account (xpub) over the wire each call, then resolves the
// fee rate from `/fees` and coin-selects. This MSW suite exercises that full multi-endpoint walk +
// fee fetch against intercepted Ledger explorer v4 routes (endpoint comes from the EXPLORER env).
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

// Pristine account: every gap-limit-walked address has no txs, so there are no spendable UTXOs. The
// `/fees` route returns real sat/kvB targets so the rate resolves before coin selection runs.
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

const asIntent = (o: Record<string, unknown>) => o as unknown as Parameters<typeof estimateFees>[2];

describe("logic/estimateFees (MSW)", () => {
  it("rejects when the account (pristine xpub) has no UTXOs to cover the amount", async () => {
    server.use(...pristineHandlers());

    await expect(
      estimateFees(
        context,
        "bitcoin",
        asIntent({
          sender: XPUB,
          recipient: RECIPIENT,
          amount: 100_000n,
          senderDerivationPath: "84'/0'/0'",
        }),
      ),
    ).rejects.toThrow(/not enough|balance|utxo|fund/i);
  });
});
