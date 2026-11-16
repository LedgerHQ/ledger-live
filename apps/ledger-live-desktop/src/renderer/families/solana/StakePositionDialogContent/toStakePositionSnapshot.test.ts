import { BigNumber } from "bignumber.js";
import type { StakingDelegation, StakingUnbonding } from "@ledgerhq/types-live";
import { toStakePositionSnapshot } from "./toStakePositionSnapshot";

const delegation = (overrides: Partial<StakingDelegation> = {}): StakingDelegation => ({
  positionId: "stake-account",
  validatorAddress: "vote-account",
  amount: new BigNumber(2_000_000_000),
  withdrawableAmount: new BigNumber(0),
  canStake: true,
  canWithdraw: true,
  pendingRewards: new BigNumber(0),
  status: "bonded",
  ...overrides,
});

const unbonding = (overrides: Partial<StakingUnbonding> = {}): StakingUnbonding => ({
  positionId: "stake-account",
  validatorAddress: "vote-account",
  amount: new BigNumber(0),
  withdrawableAmount: new BigNumber(1_500_000_000),
  canStake: true,
  canWithdraw: true,
  completionDate: new Date(0),
  status: "withdrawable",
  ...overrides,
});

describe("toStakePositionSnapshot", () => {
  it("should map an active delegation", () => {
    expect(toStakePositionSnapshot(delegation())).toEqual({
      state: "active",
      amount: 2_000_000_000n,
      withdrawableAmount: 0n,
      canStake: true,
      canWithdraw: true,
    });
  });

  it("should map a withdrawable unbonding to an inactive position", () => {
    expect(toStakePositionSnapshot(unbonding())).toMatchObject({
      state: "inactive",
      amount: 0n,
      withdrawableAmount: 1_500_000_000n,
    });
  });

  it.each([
    [delegation({ status: "activating" }), "activating"],
    [unbonding({ status: "deactivating" }), "deactivating"],
  ])("should keep the transition of %#", (position, state) => {
    expect(toStakePositionSnapshot(position).state).toBe(state);
  });

  it("should deny the authorities the account is not known to hold", () => {
    const snapshot = toStakePositionSnapshot(
      delegation({ canStake: undefined, canWithdraw: undefined }),
    );

    expect(snapshot).toMatchObject({ canStake: false, canWithdraw: false });
  });

  it("should read a missing withdrawable amount as nothing to withdraw", () => {
    expect(
      toStakePositionSnapshot(unbonding({ withdrawableAmount: undefined })).withdrawableAmount,
    ).toBe(0n);
  });

  it("should keep amounts beyond the safe integer range exact", () => {
    const amount = "20393024000000000";

    expect(toStakePositionSnapshot(delegation({ amount: new BigNumber(amount) })).amount).toBe(
      BigInt(amount),
    );
  });
});
