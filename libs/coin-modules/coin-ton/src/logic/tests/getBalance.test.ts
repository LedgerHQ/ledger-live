import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TON_API_MOCKED, createMockTonContext } from "../../test/context";
import {
  NOT_MASTER,
  NOT_MASTER_RAW,
  OWNER,
  OWNER_JETTON_WALLET_RAW,
  OWNER_RAW,
} from "../../test/history.fixtures";
import { getBalance } from "../getBalance";

const JUSDT_MASTER_RAW = "0:729C13B6DF2C07CBF0A06AB63D34AF454F3D320EC1BCD8FB5C6D24D0806A17C2";
const JUSDT_MASTER = "EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA";

const jettonWallet = (jetton: string, balance: string) => ({
  address: OWNER_JETTON_WALLET_RAW,
  balance,
  owner: OWNER_RAW,
  jetton,
  last_transaction_lt: "48954545000001",
  code_hash: "code",
  data_hash: "data",
});

describe("getBalance", () => {
  const server = setupServer();
  const context = createMockTonContext();

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const serveAccount = (account: object) =>
    server.use(http.get(`${TON_API_MOCKED}/account`, () => HttpResponse.json(account)));

  it("reports the native balance first, then each jetton by its bounceable master", async () => {
    serveAccount({ balance: "916991005", status: "active" });
    server.use(
      http.get(`${TON_API_MOCKED}/jetton/wallets`, () =>
        HttpResponse.json({
          jetton_wallets: [
            jettonWallet(JUSDT_MASTER_RAW, "500000"),
            jettonWallet(NOT_MASTER_RAW, "35000000000"),
          ],
        }),
      ),
    );

    await expect(getBalance(context, OWNER)).resolves.toEqual([
      { value: 916991005n, asset: { type: "native" } },
      {
        value: 500000n,
        asset: { type: "jetton", assetReference: JUSDT_MASTER, assetOwner: OWNER },
      },
      {
        value: 35000000000n,
        asset: { type: "jetton", assetReference: NOT_MASTER, assetOwner: OWNER },
      },
    ]);
  });

  it("reports an uninitialised account at its balance, with no jetton", async () => {
    serveAccount({ balance: "0", status: "uninit" });
    server.use(
      http.get(`${TON_API_MOCKED}/jetton/wallets`, () => HttpResponse.json({ jetton_wallets: [] })),
    );

    await expect(getBalance(context, OWNER)).resolves.toEqual([
      { value: 0n, asset: { type: "native" } },
    ]);
  });

  it("reads every page of jetton wallets", async () => {
    serveAccount({ balance: "1", status: "active" });
    const offsets: string[] = [];
    server.use(
      http.get(`${TON_API_MOCKED}/jetton/wallets`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        offsets.push(params.get("offset") ?? "");
        const size = params.get("offset") === "0" ? Number(params.get("limit")) : 1;
        return HttpResponse.json({
          jetton_wallets: Array.from({ length: size }, () => jettonWallet(NOT_MASTER_RAW, "1")),
        });
      }),
    );

    const balances = await getBalance(context, OWNER);

    expect(offsets).toEqual(["0", "1000"]);
    expect(balances).toHaveLength(1 + 1001);
  });
});
