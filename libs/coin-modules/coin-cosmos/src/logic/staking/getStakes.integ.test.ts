import { makeTestApi, TEST_BABYLON_ENDPOINT } from "../../test/msw.mock";
import { getStakes } from "./getStakes";

// A delegator to a bonded validator on the live Babylon LCD, resolved by querying a bonded
// validator's `/delegations` and picking a delegator with a non-zero stake (re-derive if it goes
// stale). Babylon's x/epoching makes exact staking amounts/counts time-dependent, so this asserts
// structural invariants only.
// Re-derived 2026-09-25: the previous delegator (bbn1kvp570cd6zvzh8ffrhz7lmytt6v6u2gxxmq6qy) fully
// unbonded (0 delegations) again, reddening this job on every coin-cosmos PR — same failure mode as
// the 2026-09-21 re-derivation. Method: GET .../cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED
// against https://babylon.coin.ledger.com, then GET .../validators/{operator_address}/delegations for a
// few large bonded validators, and picked a delegator address appearing with a non-zero balance across
// several of those validators' delegator lists. This one has active delegations to 3 distinct bonded,
// non-jailed validators (Moon Core, Keplr, Anchorage Digital 1), so a single unbonding no longer empties
// the result. Verified via GET .../cosmos/staking/v1beta1/delegations/{address}.
const ADDR = "bbn1qe2g5cspv4m59chuhrmy26f6ddrygtms6jx6zj";

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
