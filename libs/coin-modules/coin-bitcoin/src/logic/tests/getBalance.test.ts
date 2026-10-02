import { http, HttpResponse } from "msw";
import { server } from "../../test/msw";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { Currency } from "@ledgerhq/wallet-btc/crypto/types";
import { getBalance } from "../getBalance";
import { deriveAccountMeta } from "../buildAccount";
import type { BitcoinContext } from "../../api/config";

const EXPLORER = "https://btc-explorer.test.ledger.com";
const BASE = `${EXPLORER}/blockchain/v4/btc`;
const XPUB =
  "xpub6CCc6taSdhLfzELeGNNYXv7BZ7wK8kbzzgcTV9TE7sHyeVo69cq1Mwugt8ZQwtU9xLfSNsLhhuNJfYzb9s2h1ogJugMyTBRBcjpRJXbFDgC";
const DPATH = "84'/0'/0'";
const context = {
  config: async () => ({ status: { type: "active" }, explorer: { uri: BASE } }),
} as unknown as BitcoinContext;

let prevExplorer: unknown;
let ADDR0: string; // the account's first receive address (wallet-btc derivation)
beforeAll(async () => {
  prevExplorer = getEnv("EXPLORER");
  setEnv("EXPLORER", EXPLORER);
  server.listen({ onUnhandledRequest: "error" });
  const { derivationMode } = deriveAccountMeta(DPATH);
  ADDR0 = await cryptoFactory("bitcoin" as unknown as Currency).getAddress(
    derivationMode,
    XPUB,
    0,
    0,
  );
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  setEnv("EXPLORER", prevExplorer as string);
});

const blockHandlers = () => [
  http.get(`${BASE}/block/current`, () =>
    HttpResponse.json({ height: 800_000, hash: "0000abc", time: "2024-06-01T00:00:00Z" }),
  ),
  http.get(`${BASE}/block/:height`, () =>
    HttpResponse.json([{ height: 800_000, hash: "0000abc", time: "2024-06-01T00:00:00Z" }]),
  ),
  http.get(`${BASE}/address/:address/txs/pending`, () => HttpResponse.json([])),
  http.get(`${BASE}/fees`, () => HttpResponse.json({})),
  http.get(`${BASE}/network`, () => HttpResponse.json({})),
];

describe("logic/getBalance (MSW)", () => {
  it("empty account: zero balance (empty gap-limit walk)", async () => {
    server.use(
      ...blockHandlers(),
      http.get(`${BASE}/address/:address/txs`, () => HttpResponse.json({ data: [], token: null })),
    );

    const balances = await getBalance(context, "bitcoin", XPUB, DPATH);
    expect(balances).toEqual([{ value: 0n, asset: { type: "native" } }]);
  });

  it("account with unspent outputs on the first address: exact summed balance", async () => {
    // Two unspent outputs (100000 + 25000) on the first receive address; every other empty.
    const fundingTx = {
      id: "fund0",
      hash: "fund0",
      received_at: "2024-06-01T00:00:00Z",
      lock_time: 0,
      fees: "0",
      inputs: [
        {
          output_hash: "prev",
          output_index: 0,
          input_index: 0,
          value: "200000",
          address: "external",
          sequence: 0,
        },
      ],
      outputs: [
        { output_index: 0, value: "100000", address: ADDR0 },
        { output_index: 1, value: "25000", address: ADDR0 },
      ],
      block: { hash: "b799000", height: 799_000, time: "2024-06-01T00:00:00Z" },
    };
    server.use(
      ...blockHandlers(),
      http.get(`${BASE}/address/:address/txs`, ({ params }) =>
        HttpResponse.json(
          params.address === ADDR0 ? { data: [fundingTx], token: null } : { data: [], token: null },
        ),
      ),
    );

    const balances = await getBalance(context, "bitcoin", XPUB, DPATH);
    expect(balances).toEqual([{ value: 125000n, asset: { type: "native" } }]);
  });
});
