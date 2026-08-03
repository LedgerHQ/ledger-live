import { http, HttpResponse } from "msw";
import { server, TEST_COSMOS_ENDPOINT, makeTestApi } from "../../test/msw.mock";
import { getBalance } from "./getBalance";

const ADDR = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";
const BAL = `${TEST_COSMOS_ENDPOINT}/cosmos/bank/v1beta1/balances/${ADDR}`;
const DELEGATIONS = `${TEST_COSMOS_ENDPOINT}/cosmos/staking/v1beta1/delegations/${ADDR}`;
const REWARDS = `${TEST_COSMOS_ENDPOINT}/cosmos/distribution/v1beta1/delegators/${ADDR}/rewards`;
const UNBONDINGS = `${TEST_COSMOS_ENDPOINT}/cosmos/staking/v1beta1/delegators/${ADDR}/unbonding_delegations`;

// getBalance also fetches staking positions to compute `locked`; mock them empty so `locked` = 0
// and the native value stays the pure liquid balance.
const emptyStaking = [
  http.get(DELEGATIONS, () => HttpResponse.json({ delegation_responses: [] })),
  http.get(REWARDS, () => HttpResponse.json({ rewards: [] })),
  http.get(UNBONDINGS, () => HttpResponse.json({ unbonding_responses: [] })),
];

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getBalance via MSW", () => {
  it("returns the native balance, summing only the uatom denom", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(BAL, () =>
        HttpResponse.json({
          balances: [
            { denom: "uatom", amount: "5000000" },
            { denom: "ibc/SOMETHING", amount: "999" }, // non-native denom → ignored
          ],
        }),
      ),
      ...emptyStaking,
    );

    const [native] = await getBalance(api, ADDR);

    expect(native.asset).toMatchObject({ type: "native" });
    expect(native.value).toBe(5_000_000n);
  });

  it("returns zero when the address holds no uatom", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(BAL, () => HttpResponse.json({ balances: [] })),
      ...emptyStaking,
    );

    const [native] = await getBalance(api, ADDR);

    expect(native.value).toBe(0n);
  });

  it("throws when the balances endpoint errors", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(BAL, () => new HttpResponse(null, { status: 500 })),
      ...emptyStaking,
    );

    await expect(getBalance(api, ADDR)).rejects.toThrow();
  });
});
