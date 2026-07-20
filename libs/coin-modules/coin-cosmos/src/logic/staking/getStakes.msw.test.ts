import { http, HttpResponse } from "msw";
import { server, TEST_COSMOS_ENDPOINT, makeTestApi } from "../../test/msw.mock";
import { getStakes } from "./getStakes";

const ADDR = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";
const DELEGATED_VALIDATOR = "cosmosvaloper1delegated00000000000000000000";
const UNBONDING_VALIDATOR = "cosmosvaloper1unbonding00000000000000000000";

const DELEGATIONS = `${TEST_COSMOS_ENDPOINT}/cosmos/staking/v1beta1/delegations/${ADDR}`;
const VALIDATOR = (addr: string) =>
  `${TEST_COSMOS_ENDPOINT}/cosmos/staking/v1beta1/validators/${addr}`;
const REWARDS = `${TEST_COSMOS_ENDPOINT}/cosmos/distribution/v1beta1/delegators/${ADDR}/rewards`;
const UNBONDINGS = `${TEST_COSMOS_ENDPOINT}/cosmos/staking/v1beta1/delegators/${ADDR}/unbonding_delegations`;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getStakes via MSW", () => {
  it("maps a bonded delegation with rewards, plus an in-progress unbonding", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(DELEGATIONS, () =>
        HttpResponse.json({
          delegation_responses: [
            {
              delegation: { validator_address: DELEGATED_VALIDATOR },
              balance: { denom: "uatom", amount: "1000000" },
            },
          ],
        }),
      ),
      http.get(VALIDATOR(DELEGATED_VALIDATOR), () =>
        HttpResponse.json({ validator: { status: "BOND_STATUS_BONDED" } }),
      ),
      http.get(REWARDS, () =>
        HttpResponse.json({
          rewards: [
            { validator_address: DELEGATED_VALIDATOR, reward: [{ denom: "uatom", amount: "500" }] },
          ],
        }),
      ),
      http.get(UNBONDINGS, () =>
        HttpResponse.json({
          unbonding_responses: [
            {
              validator_address: UNBONDING_VALIDATOR,
              entries: [{ initial_balance: "700", completion_time: "2030-01-01T00:00:00Z" }],
            },
          ],
        }),
      ),
    );

    const page = await getStakes(api, ADDR, "cosmos");

    expect(page.items).toHaveLength(2);

    const active = page.items.find(s => s.delegate === DELEGATED_VALIDATOR);
    expect(active).not.toBeUndefined();
    expect(active!.state).toBe("active");
    expect(active!.amountDeposited).toBe(1_000_000n);
    expect(active!.amountRewarded).toBe(500n);
    // amount = amountDeposited + amountRewarded (getStakes.ts): 1_000_000 + 500 = 1_000_500.
    expect(active!.amount).toBe(1_000_500n);
    expect(active!.actions).toEqual(
      expect.arrayContaining(["undelegate", "redelegate", "claim_reward"]),
    );

    const unbonding = page.items.find(s => s.delegate === UNBONDING_VALIDATOR);
    expect(unbonding).not.toBeUndefined();
    // completion_time (2030) is in the future relative to any real test run, so this stays "deactivating".
    expect(unbonding!.state).toBe("deactivating");
    expect(unbonding!.amount).toBe(700n);
    expect(unbonding!.amountDeposited).toBe(700n);
    expect(unbonding!.amountRewarded).toBe(0n);
    expect(unbonding!.actions).toEqual([]);
  });

  it("returns empty items for a non-delegated, non-unbonding account", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(DELEGATIONS, () => HttpResponse.json({ delegation_responses: [] })),
      // getDelegations only calls the per-validator endpoint inside the delegation loop, so with
      // zero delegations it's never hit; not stubbing it (with onUnhandledRequest:"error") proves that.
      http.get(REWARDS, () => HttpResponse.json({ rewards: [] })),
      http.get(UNBONDINGS, () => HttpResponse.json({ unbonding_responses: [] })),
    );

    const page = await getStakes(api, ADDR, "cosmos");

    expect(page.items).toEqual([]);
  });

  // `CosmosAPI.getDelegations` has no internal try/catch, so a failing request propagates; `getStakes`
  // awaits `Promise.all([getDelegations, getUnbondings])`, which rejects as soon as either does.
  it("throws when the delegations endpoint errors", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(DELEGATIONS, () => new HttpResponse(null, { status: 500 })),
      // Stubbed so the concurrent getUnbondings() call (fired by the same Promise.all) doesn't
      // trip onUnhandledRequest:"error" before the delegations rejection is observed.
      http.get(UNBONDINGS, () => HttpResponse.json({ unbonding_responses: [] })),
    );

    await expect(getStakes(api, ADDR, "cosmos")).rejects.toThrow();
  });
});
