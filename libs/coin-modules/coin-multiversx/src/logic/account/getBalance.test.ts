import { http, HttpResponse } from "msw";
import { getBalance } from "./getBalance";
import { server, useMswServer, testNetworkApi, TEST_API, TEST_DELEGATION_API } from "../tests/msw";

const ADDR = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

describe("getBalance (msw)", () => {
  useMswServer();

  it("aggregates native (spendable + delegation) and ESDT balances from the API", async () => {
    server.use(
      http.get(`${TEST_API}/accounts/:addr`, () =>
        HttpResponse.json({ balance: "1000000000000000000", nonce: 5, isGuarded: false }),
      ),
      http.get(`${TEST_DELEGATION_API}/accounts/:addr/delegations`, () =>
        HttpResponse.json([
          {
            contract: "erd1contract",
            userActiveStake: "2000000000000000000",
            claimableRewards: "0",
            userUndelegatedList: [],
          },
        ]),
      ),
      http.get(`${TEST_API}/accounts/:addr/tokens/count`, () => HttpResponse.json(1)),
      http.get(`${TEST_API}/accounts/:addr/tokens`, () =>
        HttpResponse.json([{ identifier: "USDC-c76f1f", balance: "42" }]),
      ),
    );

    const balances = await getBalance(testNetworkApi(), ADDR);

    expect(balances).toEqual([
      {
        value: 3000000000000000000n, // 1e18 spendable + 2e18 delegated
        asset: { type: "native" },
        locked: 2000000000000000000n,
      },
      {
        value: 42n,
        asset: { type: "esdt", assetReference: "USDC-c76f1f" },
      },
    ]);
  });

  it("includes unbonding (userUndelegatedList) amounts in the delegation balance", async () => {
    server.use(
      http.get(`${TEST_API}/accounts/:addr`, () =>
        HttpResponse.json({ balance: "1000000000000000000", nonce: 1, isGuarded: false }),
      ),
      http.get(`${TEST_DELEGATION_API}/accounts/:addr/delegations`, () =>
        HttpResponse.json([
          {
            contract: "erd1contract",
            userActiveStake: "2000000000000000000",
            claimableRewards: "0",
            userUndelegatedList: [{ amount: "500000000000000000", seconds: 100 }],
          },
        ]),
      ),
      http.get(`${TEST_API}/accounts/:addr/tokens/count`, () => HttpResponse.json(0)),
    );

    const balances = await getBalance(testNetworkApi(), ADDR);

    // 1e18 spendable + (2e18 active + 0.5e18 unbonding) delegated
    expect(balances[0]).toEqual({
      value: 3500000000000000000n,
      asset: { type: "native" },
      locked: 2500000000000000000n,
    });
  });

  it("returns zero-balance ESDT entries with the identifier case preserved", async () => {
    server.use(
      http.get(`${TEST_API}/accounts/:addr`, () =>
        HttpResponse.json({ balance: "0", nonce: 0, isGuarded: false }),
      ),
      http.get(`${TEST_DELEGATION_API}/accounts/:addr/delegations`, () => HttpResponse.json([])),
      http.get(`${TEST_API}/accounts/:addr/tokens/count`, () => HttpResponse.json(1)),
      http.get(`${TEST_API}/accounts/:addr/tokens`, () =>
        HttpResponse.json([{ identifier: "WEGLD-bd4d79", balance: "0" }]),
      ),
    );

    const balances = await getBalance(testNetworkApi(), ADDR);

    const esdt = balances.find(b => b.asset.type === "esdt");
    expect(esdt).toEqual({ value: 0n, asset: { type: "esdt", assetReference: "WEGLD-bd4d79" } });
  });
});
