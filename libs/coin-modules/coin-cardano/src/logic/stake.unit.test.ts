import BigNumber from "bignumber.js";
import { getDelegationFixture, STAKING_ADDRESS } from "../fixtures/delegation";
import type { CardanoDelegation } from "../types";
import { NATIVE_ASSET, buildStake } from "./stake";

const STAKE_KEY = "e6d2e439c2d7bad6f8a35f1806538256cfb5ff21ad4cdba421643de0";

describe("buildStake", () => {
  it("returns undefined without a stake key", () => {
    expect(buildStake(STAKING_ADDRESS, undefined, getDelegationFixture())).toBeUndefined();
  });

  it("returns undefined without a delegation", () => {
    expect(buildStake(STAKING_ADDRESS, STAKE_KEY, undefined)).toBeUndefined();
  });

  it("returns undefined when not delegated and no rewards remain", () => {
    const stake = buildStake(
      STAKING_ADDRESS,
      STAKE_KEY,
      getDelegationFixture({ status: false, poolId: undefined, deposit: "0" }),
    );
    expect(stake).toBeUndefined();
  });

  it("returns an inactive stake when not delegated but rewards remain", () => {
    const stake = buildStake(
      STAKING_ADDRESS,
      STAKE_KEY,
      getDelegationFixture({
        status: false,
        poolId: undefined,
        ticker: undefined,
        name: undefined,
        rewards: new BigNumber(1_000_000),
      }),
    );

    expect(stake).toMatchObject({
      uid: STAKE_KEY,
      address: STAKING_ADDRESS,
      state: "inactive",
      asset: NATIVE_ASSET,
      amountDeposited: 2_000_000n,
      amountRewarded: 1_000_000n,
      amount: 3_000_000n,
      // Not delegated (no poolId): the only transition is to delegate.
      actions: ["delegate"],
    });
    expect(stake?.delegate).toBeUndefined();
    expect(stake?.details).toBeUndefined();
  });

  it("maps an active delegation's pool to delegate and metadata to details", () => {
    const stake = buildStake(STAKING_ADDRESS, STAKE_KEY, getDelegationFixture({ dRepHex: "drep1abc" }));

    expect(stake).toMatchObject({
      state: "active",
      delegate: "pool1xyz",
      details: { ticker: "TICK", name: "Pool", dRepHex: "drep1abc" },
    });
  });

  it("treats a registered key with no pool as not staking (keys on poolId, not status)", () => {
    // status: true (registered) but no poolId and no rewards → no position; a position is staking
    // only once delegated to a pool, not merely once the stake key is registered.
    const stake = buildStake(STAKING_ADDRESS, STAKE_KEY, getDelegationFixture({ poolId: undefined }));
    expect(stake).toBeUndefined();
  });

  it("offers only delegate for a registered key with no pool but residual rewards", () => {
    // status: true but no poolId, with rewards remaining → surfaced (rewards), yet still keyed on
    // poolId: state is inactive and the only action is delegate (no undelegate without a pool).
    const stake = buildStake(
      STAKING_ADDRESS,
      STAKE_KEY,
      getDelegationFixture({
        status: true,
        poolId: undefined,
        ticker: undefined,
        name: undefined,
        rewards: new BigNumber(1_000_000),
      }),
    );

    expect(stake?.state).toBe("inactive");
    expect(stake?.actions).toEqual(["delegate"]);
  });

  it("offers delegate + undelegate for an active delegation, regardless of rewards/dRep", () => {
    const actions = (over: Partial<CardanoDelegation> = {}) =>
      buildStake(STAKING_ADDRESS, STAKE_KEY, getDelegationFixture(over))?.actions;

    // Default fixture is delegated (poolId set). delegate = change pool (Cardano has no separate
    // redelegate cert); undelegate = deregister. No standalone claim action — rewards are withdrawn
    // implicitly within a tx — so rewards / dRep never change the action set.
    expect(actions()).toEqual(["delegate", "undelegate"]);
    expect(actions({ rewards: new BigNumber(5_000_000), dRepHex: "drep1abc" })).toEqual([
      "delegate",
      "undelegate",
    ]);
    expect(actions({ rewards: new BigNumber(5_000_000), dRepHex: undefined })).toEqual([
      "delegate",
      "undelegate",
    ]);
  });
});
