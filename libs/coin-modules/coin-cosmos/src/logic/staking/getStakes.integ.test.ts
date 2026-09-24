import { makeTestApi, TEST_BABYLON_ENDPOINT } from "../../test/msw.mock";
import { getStakes } from "./getStakes";

// A delegator to a bonded validator on the live Babylon LCD, resolved by querying a bonded
// validator's `/delegations` and picking a delegator with a non-zero stake (re-derive if it goes
// stale). Babylon's x/epoching makes exact staking amounts/counts time-dependent, so this asserts
// structural invariants only.
// Re-derived 2026-09-21: the previous delegator fully unbonded (0 delegations), reddening this
// job on every coin-cosmos PR. This one spreads its stake across three bonded validators, so
// a single unbonding no longer empties the result.
const ADDR = "bbn1kvp570cd6zvzh8ffrhz7lmytt6v6u2gxxmq6qy";

describe("getStakes (integ, Babylon)", () => {
  it("returns stakes with a well-formed delegate address and a positive amount", async () => {
    const api = makeTestApi("babylon", TEST_BABYLON_ENDPOINT);

    const page = await getStakes(api, ADDR);

    expect(page.items.length).toBeGreaterThan(0);
    for (const stake of page.items) {
      expect(stake.delegate).toMatch(/^bbnvaloper1/);
      expect(stake.amount > 0n).toBe(true);
    }
  });
});
