import BigNumber from "bignumber.js";
import type { AleoStakingPosition } from "./react";
import {
  getUnbondingDisplayState,
  getUnstakingBalance,
  isPositionClaimable,
} from "./stakingDisplay";

const UNBONDING_HEIGHT = 1_000;

const position = (overrides: Partial<AleoStakingPosition> = {}): AleoStakingPosition => ({
  bondedBalance: new BigNumber(0),
  bondedValidator: null,
  validatorLabel: "",
  nonEarningReason: undefined,
  estimatedRate: undefined,
  unbondingBalance: new BigNumber(5_000),
  unbondingHeight: UNBONDING_HEIGHT,
  claimableBalance: new BigNumber(0),
  hasBonded: false,
  hasUnbonding: true,
  hasPendingUnbond: false,
  hasPendingClaim: false,
  hasPendingUnbondingChange: false,
  ...overrides,
});

describe("getUnbondingDisplayState", () => {
  it("reports claimable once the synced height has produced a claimable balance", () => {
    const state = getUnbondingDisplayState({
      position: position({ claimableBalance: new BigNumber(5_000) }),
      syncedHeight: UNBONDING_HEIGHT + 1,
      currentHeight: UNBONDING_HEIGHT + 1,
    });

    expect(state).toEqual({
      isClaimable: true,
      isCountingDown: false,
      isSettling: false,
      blocksLeft: 0,
    });
  });

  it("counts down in blocks while the chain has not reached the unbonding height", () => {
    const state = getUnbondingDisplayState({
      position: position(),
      syncedHeight: UNBONDING_HEIGHT - 40,
      currentHeight: UNBONDING_HEIGHT - 10,
    });

    expect(state).toEqual({
      isClaimable: false,
      isCountingDown: true,
      isSettling: false,
      blocksLeft: 10,
    });
  });

  // The live poll sees the crossing seconds before the account sync does; that gap is the
  // settling state, and it is what triggers useSyncOnUnbondingComplete.
  it("reports settling when the live height passed the unbonding height but the sync has not", () => {
    const state = getUnbondingDisplayState({
      position: position(),
      syncedHeight: UNBONDING_HEIGHT - 5,
      currentHeight: UNBONDING_HEIGHT + 2,
    });

    expect(state).toEqual({
      isClaimable: false,
      isCountingDown: true,
      isSettling: true,
      blocksLeft: 0,
    });
  });

  it("reports nothing to display without an unbonding entry", () => {
    const state = getUnbondingDisplayState({
      position: position({
        unbondingBalance: new BigNumber(0),
        unbondingHeight: null,
        hasUnbonding: false,
      }),
      syncedHeight: UNBONDING_HEIGHT,
      currentHeight: UNBONDING_HEIGHT,
    });

    expect(state).toEqual({
      isClaimable: false,
      isCountingDown: false,
      isSettling: false,
      blocksLeft: null,
    });
  });
});

describe("isPositionClaimable", () => {
  it("is true once the claimable balance is positive", () => {
    expect(isPositionClaimable(position({ claimableBalance: new BigNumber(1) }))).toBe(true);
  });

  it("is false while the claimable balance is zero", () => {
    expect(isPositionClaimable(position({ claimableBalance: new BigNumber(0) }))).toBe(false);
  });
});

describe("getUnstakingBalance", () => {
  it("is the whole unbonding entry while none of it is claimable", () => {
    expect(getUnstakingBalance(position()).toString()).toBe("5000");
  });

  it("is zero once the entry became claimable", () => {
    const claimable = position({ claimableBalance: new BigNumber(5_000) });

    expect(getUnstakingBalance(claimable).toString()).toBe("0");
  });

  it("is zero without an unbonding entry", () => {
    const none = position({
      unbondingBalance: new BigNumber(0),
      unbondingHeight: null,
      hasUnbonding: false,
    });

    expect(getUnstakingBalance(none).toString()).toBe("0");
  });
});
