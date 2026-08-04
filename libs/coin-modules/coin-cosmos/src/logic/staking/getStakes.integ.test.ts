import { makeTestApi, TEST_BABYLON_ENDPOINT } from "../../test/msw.mock";
import { getStakes } from "./getStakes";

// A delegator to a bonded validator on the live Babylon LCD, resolved by querying a bonded
// validator's `/delegations` and picking a delegator with a non-zero stake (re-derive if it goes
// stale). Babylon's x/epoching makes exact staking amounts/counts time-dependent, so this asserts
// structural invariants only.
const ADDR = "bbn1qndfkmcjxnlk3eh79x4d763u48d6lss8up9spn";

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
