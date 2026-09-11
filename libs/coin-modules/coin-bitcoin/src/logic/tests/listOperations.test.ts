import { http, HttpResponse } from "msw";
import { server } from "../../test/msw";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { listOperations } from "../listOperations";
import type { BitcoinContext } from "../../api/config";

// listOperations walks the xpub through wallet-btc, whose explorer endpoint comes from the EXPLORER
// env (base = `${EXPLORER}/blockchain/v4/btc`). Set the env and intercept the pristine-sync routes.
const EXPLORER = "https://btc-explorer.test.ledger.com";
const BASE = `${EXPLORER}/blockchain/v4/btc`;
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

describe("logic/listOperations (MSW)", () => {
  it("returns an empty, cursor-less page for a pristine xpub (no operations)", async () => {
    server.use(...pristineHandlers());

    const page = await listOperations(context, "bitcoin", XPUB, {
      minHeight: 0,
      derivationPath: "84'/0'/0'",
    });

    expect(page.items).toEqual([]);
    expect(page.next).toBeUndefined();
  });
});
