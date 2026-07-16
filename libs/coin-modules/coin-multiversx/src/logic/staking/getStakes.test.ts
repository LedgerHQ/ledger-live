import { http, HttpResponse } from "msw";
import { getStakes } from "./getStakes";
import { server, useMswServer, testNetworkApi, TEST_DELEGATION_API } from "../tests/msw";

const ADDR = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

describe("getStakes (msw)", () => {
  useMswServer();

  it("maps active stake and a matured unbonding entry from the delegation API", async () => {
    server.use(
      http.get(`${TEST_DELEGATION_API}/accounts/:addr/delegations`, () =>
        HttpResponse.json([
          {
            contract: "erd1contract",
            userActiveStake: "1000000000000000000",
            claimableRewards: "50000000000000000",
            userUndelegatedList: [{ amount: "200000000000000000", seconds: 0 }],
          },
        ]),
      ),
    );

    const page = await getStakes(testNetworkApi(), ADDR);

    const active = page.items.find(s => s.state === "active");
    expect(active?.amount).toBe(1050000000000000000n); // stake + rewards
    expect(active?.amountRewarded).toBe(50000000000000000n);

    const withdrawable = page.items.find(s => s.state === "withdrawable");
    expect(withdrawable?.amount).toBe(200000000000000000n);
    expect(withdrawable?.actions).toEqual(["withdraw"]);
  });

  it("returns an empty page for a non-delegated account", async () => {
    server.use(
      http.get(`${TEST_DELEGATION_API}/accounts/:addr/delegations`, () => HttpResponse.json([])),
    );

    const page = await getStakes(testNetworkApi(), ADDR);
    expect(page.items).toHaveLength(0);
  });
});
