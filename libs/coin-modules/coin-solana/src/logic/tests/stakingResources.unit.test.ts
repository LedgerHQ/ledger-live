import BigNumber from "bignumber.js";
import type { StakingDelegation, StakingUnbonding } from "@ledgerhq/types-live";
import {
  emptyStakingResources,
  findSolanaStakingPosition,
  listSolanaStakingPositions,
  requireStakePositionId,
  solanaActivationState,
  solanaStakesToStakingResources,
  stakeActions,
  stakeActivePercent,
} from "../stakingResources";
import type { SolanaAccount, SolanaStake, SolanaStakingPosition } from "../../types";

const activeStake: SolanaStake = {
  stakeAccAddr: "stake-active",
  hasStakeAuth: true,
  hasWithdrawAuth: true,
  delegation: { stake: 400, voteAccAddr: "vote-1" },
  stakeAccBalance: 500,
  rentExemptReserve: 10,
  withdrawable: 90,
  activation: { state: "active", active: 400, inactive: 90 },
};

const inactiveStake: SolanaStake = {
  stakeAccAddr: "stake-inactive",
  hasStakeAuth: true,
  hasWithdrawAuth: true,
  delegation: { stake: 0, voteAccAddr: "vote-2" },
  stakeAccBalance: 200,
  rentExemptReserve: 10,
  withdrawable: 200,
  activation: { state: "inactive", active: 0, inactive: 190 },
};

const deactivatingStake: SolanaStake = {
  stakeAccAddr: "stake-deactivating",
  hasStakeAuth: false,
  hasWithdrawAuth: true,
  delegation: { stake: 300, voteAccAddr: "vote-3" },
  stakeAccBalance: 320,
  rentExemptReserve: 10,
  withdrawable: 0,
  activation: { state: "deactivating", active: 300, inactive: 0 },
};

const activatingStake: SolanaStake = {
  stakeAccAddr: "stake-activating",
  hasStakeAuth: true,
  hasWithdrawAuth: false,
  delegation: { stake: 100, voteAccAddr: "vote-4" },
  stakeAccBalance: 110,
  rentExemptReserve: 10,
  withdrawable: 0,
  activation: { state: "activating", active: 0, inactive: 100 },
  reward: { amount: 12 },
};

function delegation(overrides: Partial<StakingDelegation> = {}): StakingDelegation {
  return {
    positionId: "stake-delegation",
    validatorAddress: "vote-1",
    amount: new BigNumber(100),
    pendingRewards: new BigNumber(0),
    status: "bonded",
    ...overrides,
  };
}

function unbonding(overrides: Partial<StakingUnbonding> = {}): StakingUnbonding {
  return {
    positionId: "stake-unbonding",
    validatorAddress: "vote-2",
    amount: new BigNumber(50),
    completionDate: new Date(0),
    status: "deactivating",
    ...overrides,
  };
}

describe("solanaStakesToStakingResources", () => {
  it("maps active stakes to delegations and inactive stakes to unbondings", () => {
    const resources = solanaStakesToStakingResources(
      [activeStake, inactiveStake],
      new BigNumber(7),
    );

    expect(resources.delegations).toHaveLength(1);
    expect(resources.delegations[0]).toMatchObject({
      positionId: "stake-active",
      validatorAddress: "vote-1",
      status: "bonded",
      canStake: true,
      canWithdraw: true,
    });
    expect(resources.delegations[0].amount).toEqual(new BigNumber(400));
    expect(resources.delegations[0].withdrawableAmount).toEqual(new BigNumber(90));

    expect(resources.unbondings).toHaveLength(1);
    expect(resources.unbondings[0]).toMatchObject({
      positionId: "stake-inactive",
      validatorAddress: "vote-2",
      status: "withdrawable",
    });
    expect(resources.actionFeeReserve).toEqual(new BigNumber(7));
    expect(resources.delegatedBalance).toEqual(new BigNumber(400));
    expect(resources.unbondingBalance).toEqual(new BigNumber(0));
  });

  it("maps deactivating stakes to unbondings and activating stakes to delegations", () => {
    const resources = solanaStakesToStakingResources(
      [deactivatingStake, activatingStake],
      new BigNumber(0),
    );

    expect(resources.unbondings[0]).toMatchObject({
      positionId: "stake-deactivating",
      status: "deactivating",
      canStake: false,
    });
    expect(resources.unbondingBalance).toEqual(new BigNumber(300));

    expect(resources.delegations[0]).toMatchObject({
      positionId: "stake-activating",
      status: "activating",
      canWithdraw: false,
    });
    expect(resources.delegations[0].pendingRewards).toEqual(new BigNumber(12));
    expect(resources.pendingRewardsBalance).toEqual(new BigNumber(12));
  });

  it("falls back to an empty validator address and zero amount for undelegated stakes", () => {
    const undelegated: SolanaStake = {
      ...inactiveStake,
      delegation: undefined,
    };

    const resources = solanaStakesToStakingResources([undelegated], new BigNumber(0));

    expect(resources.unbondings[0].validatorAddress).toBe("");
    expect(resources.unbondings[0].amount).toEqual(new BigNumber(0));
  });
});

describe("emptyStakingResources", () => {
  it("omits actionFeeReserve unless one is provided", () => {
    expect(emptyStakingResources()).not.toHaveProperty("actionFeeReserve");
    expect(emptyStakingResources(new BigNumber(4)).actionFeeReserve).toEqual(new BigNumber(4));
  });
});

describe("listSolanaStakingPositions", () => {
  it("concatenates delegations and unbondings, and tolerates missing resources", () => {
    const resources = {
      ...emptyStakingResources(),
      delegations: [delegation()],
      unbondings: [unbonding()],
    };

    expect(listSolanaStakingPositions(resources)).toEqual([delegation(), unbonding()]);
    expect(listSolanaStakingPositions(undefined)).toEqual([]);
  });

  it("orders by delegated amount across both buckets, not delegations first", () => {
    const resources = {
      ...emptyStakingResources(),
      delegations: [delegation({ positionId: "small-active", amount: new BigNumber(10) })],
      unbondings: [unbonding({ positionId: "large-deactivating", amount: new BigNumber(900) })],
    };

    expect(listSolanaStakingPositions(resources).map(p => p.positionId)).toEqual([
      "large-deactivating",
      "small-active",
    ]);
  });

  it("breaks ties on the withdrawable amount, descending", () => {
    const resources = {
      ...emptyStakingResources(),
      delegations: [
        delegation({ positionId: "no-withdrawable", amount: new BigNumber(100) }),
        delegation({
          positionId: "some-withdrawable",
          amount: new BigNumber(100),
          withdrawableAmount: new BigNumber(7),
        }),
      ],
      unbondings: [],
    };

    expect(listSolanaStakingPositions(resources).map(p => p.positionId)).toEqual([
      "some-withdrawable",
      "no-withdrawable",
    ]);
  });
});

describe("findSolanaStakingPosition", () => {
  const account = {
    stakingResources: {
      ...emptyStakingResources(),
      unbondings: [unbonding({ positionId: "position-1" })],
    },
  } as SolanaAccount;

  it("finds a position by its id", () => {
    expect(findSolanaStakingPosition(account, "position-1")).toMatchObject({
      positionId: "position-1",
    });
  });

  it("returns undefined for an unknown id", () => {
    expect(findSolanaStakingPosition(account, "nope")).toBeUndefined();
  });
});

describe("solanaActivationState", () => {
  it.each([
    ["bonded" as const, "active"],
    ["activating" as const, "activating"],
    ["unbonding" as const, "deactivating"],
    ["unbonded" as const, "inactive"],
  ])("maps the %s delegation status to %s", (status, expected) => {
    expect(solanaActivationState(delegation({ status }))).toBe(expected);
  });

  it.each([
    ["withdrawable" as const, "inactive"],
    ["deactivating" as const, "deactivating"],
  ])("maps the %s unbonding status to %s", (status, expected) => {
    expect(solanaActivationState(unbonding({ status }))).toBe(expected);
  });

  it("treats an unbonding without a status as deactivating", () => {
    const { status: _status, ...withoutStatus } = unbonding();
    expect(solanaActivationState(withoutStatus)).toBe("deactivating");
  });
});

describe("stakeActions", () => {
  it("offers withdraw only when there is a withdrawable amount", () => {
    expect(stakeActions(delegation({ withdrawableAmount: new BigNumber(1) }))).toContain(
      "withdraw",
    );
    expect(stakeActions(delegation())).not.toContain("withdraw");
  });

  it.each([
    [delegation({ status: "bonded" }), "deactivate"],
    [delegation({ status: "activating" }), "deactivate"],
    [unbonding({ status: "deactivating" }), "reactivate"],
    [unbonding({ status: "withdrawable" }), "activate"],
  ])("derives the action matching the activation state", (position, expected) => {
    expect(stakeActions(position)).toContain(expected);
  });
});

describe("stakeActions", () => {
  it("offers no action on a position without a stake account address", () => {
    const { positionId: _absent, ...noId } = delegation();

    expect(stakeActions(noId)).toEqual([]);
    expect(
      stakeActions(unbonding({ positionId: "", withdrawableAmount: new BigNumber(500) })),
    ).toEqual([]);
  });
});

describe("stakeActivePercent", () => {
  it("returns the active share of the delegated amount", () => {
    expect(
      stakeActivePercent(
        delegation({
          amount: new BigNumber(200),
          activeAmount: new BigNumber(50),
        }),
      ),
    ).toBe(25);
  });

  it("returns 0 when nothing is delegated or the active amount is unknown", () => {
    expect(stakeActivePercent(delegation({ amount: new BigNumber(0) }))).toBe(0);
    expect(stakeActivePercent(delegation({ amount: new BigNumber(100) }))).toBe(0);
  });
});

describe("requireStakePositionId", () => {
  it("returns the stake account address of the position", () => {
    expect(
      requireStakePositionId({
        positionId: "stake-acc-1",
      } as SolanaStakingPosition),
    ).toBe("stake-acc-1");
  });

  it.each([undefined, ""])("throws rather than yielding %p as an address", positionId => {
    expect(() => requireStakePositionId({ positionId } as SolanaStakingPosition)).toThrow(
      "solana: staking position is missing its stake account address",
    );
  });
});
