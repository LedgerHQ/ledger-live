import { http, HttpResponse } from "msw";
import { server } from "../../test/msw";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { getBalance } from "../getBalance";
import type { BitcoinContext } from "../../api/config";

// getBalance walks the xpub through wallet-btc, whose explorer endpoint comes from the EXPLORER env
// (base = `${EXPLORER}/blockchain/v4/btc`) — not `config.explorer.uri`. So we set the env and
// intercept the Ledger explorer v4 routes a pristine sync touches.
const EXPLORER = "https://btc-explorer.test.ledger.com";
const BASE = `${EXPLORER}/blockchain/v4/btc`;
// Valid mainnet xpub; wallet-btc derives receive/change addresses from it. The MSW handlers match
// ANY derived address, so the exact addresses are irrelevant.
const XPUB =
  "xpub6CCc6taSdhLfzELeGNNYXv7BZ7wK8kbzzgcTV9TE7sHyeVo69cq1Mwugt8ZQwtU9xLfSNsLhhuNJfYzb9s2h1ogJugMyTBRBcjpRJXbFDgC";
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

// A pristine account: every gap-limit-walked address returns no txs, so the balance is 0. Handlers
// cover every explorer route a pristine sync may touch (no `tx/:hash/hex` — that is UTXO-only).
const pristineHandlers = () => [
  http.get(`${BASE}/block/current`, () =>
    HttpResponse.json({ height: 800_000, hash: "0000abc", time: "2024-06-01T00:00:00Z" }),
  ),
  http.get(`${BASE}/block/:height`, () =>
    HttpResponse.json([{ height: 800_000, hash: "0000abc", time: "2024-06-01T00:00:00Z" }]),
  ),
  http.get(`${BASE}/address/:address/txs`, () => HttpResponse.json({ data: [], token: null })),
  http.get(`${BASE}/address/:address/txs/pending`, () => HttpResponse.json([])),
  http.get(`${BASE}/fees`, () => HttpResponse.json({})),
  http.get(`${BASE}/network`, () => HttpResponse.json({})),
];

describe("logic/getBalance (MSW)", () => {
  it("returns a zero native balance for a pristine xpub (empty gap-limit walk)", async () => {
    server.use(...pristineHandlers());

    const balances = await getBalance(context, "bitcoin", XPUB, "84'/0'/0'");

    expect(balances).toEqual([{ value: 0n, asset: { type: "native" } }]);
  });
});
