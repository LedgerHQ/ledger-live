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

  it("returns undefined when unregistered and no rewards remain", () => {
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
    const stake = buildStake(
      STAKING_ADDRESS,
      STAKE_KEY,
      getDelegationFixture({ dRepHex: "drep1abc" }),
    );

    expect(stake).toMatchObject({
      state: "active",
      delegate: "pool1xyz",
      details: { ticker: "TICK", name: "Pool", dRepHex: "drep1abc" },
    });
  });

  it("surfaces a registered key with no pool as an inactive, deregisterable position", () => {
    // status: true (registered) locks a refundable deposit and can be deregistered, so it's reported
    // even with no active pool — keyed on status, not poolId.
    const stake = buildStake(
      STAKING_ADDRESS,
      STAKE_KEY,
      getDelegationFixture({ poolId: undefined, ticker: undefined, name: undefined }),
    );

    expect(stake).toMatchObject({
      state: "inactive",
      amountDeposited: 2_000_000n,
      amountRewarded: 0n,
      amount: 2_000_000n,
      actions: ["delegate", "undelegate"],
    });
    expect(stake?.delegate).toBeUndefined();
  });

  it("offers delegate + undelegate for a registered key with no pool and residual rewards", () => {
    // status: true, no poolId, rewards remaining → reported; keyed on status, so deregister
    // (undelegate) is offered to reclaim the deposit even without an active pool.
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
    expect(stake?.actions).toEqual(["delegate", "undelegate"]);
    expect(stake?.amountRewarded).toBe(1_000_000n);
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
