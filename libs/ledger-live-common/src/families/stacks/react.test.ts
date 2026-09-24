import BigNumber from "bignumber.js";
import { getStacksStakingPosition, getStacksUnlockCycle } from "./react";
import type { StacksAccount, StakingPosition } from "./types";

const makeAccount = (positions?: StakingPosition[]): StacksAccount =>
  ({
    type: "Account",
    currency: { family: "stacks" },
    stakingPositions: positions,
  }) as unknown as StacksAccount;

const makePosition = (overrides: Partial<StakingPosition> = {}): StakingPosition =>
  ({
    uid: "SP1staker",
    address: "SP1staker",
    delegate: "SP1pool.native-pool-signer-manager",
    state: "active",
    asset: { type: "native" },
    amount: new BigNumber(1000),
    actions: ["undelegate"],
    details: {
      firstRewardCycle: 10,
      numCycles: 6,
      rewardAsset: "sbtc",
      amountRewarded: "0",
    },
    ...overrides,
  }) as unknown as StakingPosition;

describe("getStacksStakingPosition", () => {
  it("returns undefined when the account has no staking positions", () => {
    expect(getStacksStakingPosition(makeAccount(undefined))).toBeUndefined();
    expect(getStacksStakingPosition(makeAccount([]))).toBeUndefined();
  });

  it("returns stakingPositions[0], ignoring any position beyond index 0", () => {
    const first = makePosition({ uid: "first" });
    const second = makePosition({ uid: "second" });
    expect(getStacksStakingPosition(makeAccount([first, second]))).toBe(first);
  });
});

describe("getStacksUnlockCycle", () => {
  it("returns firstRewardCycle + numCycles from the position's details", () => {
    const position = makePosition({
      details: { firstRewardCycle: 42, numCycles: 6, rewardAsset: "sbtc", amountRewarded: "0" },
    });
    expect(getStacksUnlockCycle(position)).toBe(48);
  });
});
