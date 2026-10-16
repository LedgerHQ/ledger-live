import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import BigNumber from "bignumber.js";
import {
  deriveDelegationStatus,
  hasActiveStake,
  hasDeactivatingStake,
  hasStake,
  stakingPositionDetails,
  stakingShapeOf,
  toStakingPositionOnAccount,
} from "./staking";

const stake = (fields: Partial<Stake> = {}): Stake => ({
  uid: "stake-1",
  address: "addr",
  delegate: "val1",
  state: "active",
  asset: { type: "native" },
  amount: 100n,
  actions: [],
  ...fields,
});

const validators = [
  {
    validatorAddress: "val1",
    name: "Validator 1",
    commission: 0,
    tokens: "0",
    votingPower: 0,
    estimatedYearlyRewardsRate: 0,
  },
];

describe("stake predicates", () => {
  it("tells a balance carrying a stake", () => {
    expect(hasStake({ value: 1n, asset: { type: "native" }, stake: stake() })).toBe(true);
    expect(hasStake({ value: 1n, asset: { type: "native" } })).toBe(false);
  });

  it.each([
    ["active", true, false],
    ["activating", true, false],
    ["deactivating", false, true],
    ["withdrawable", false, true],
    ["inactive", false, true],
  ] as const)("reads a %s stake as active: %s, deactivating: %s", (state, active, deactivating) => {
    expect(hasActiveStake(stake({ state }))).toBe(active);
    expect(hasDeactivatingStake(stake({ state }))).toBe(deactivating);
  });
});

describe("deriveDelegationStatus", () => {
  it("is activating, the allow-listed detail status, or bonded", () => {
    expect(deriveDelegationStatus("activating", "unbonding")).toBe("activating");
    expect(deriveDelegationStatus("active", "unbonding")).toBe("unbonding");
    expect(deriveDelegationStatus("active", "unbonded")).toBe("unbonded");
    expect(deriveDelegationStatus("active", "jailed")).toBe("bonded");
    expect(deriveDelegationStatus("active", undefined)).toBe("bonded");
  });
});

describe("stakingPositionDetails", () => {
  it("maps the uid and the numeric and boolean details, a zero amount included", () => {
    expect(
      stakingPositionDetails(
        stake({
          details: {
            activeAmount: 5n,
            inactiveAmount: "0",
            withdrawableAmount: 2,
            lockedReserve: "7",
            canStake: false,
            canWithdraw: true,
          },
        }),
      ),
    ).toEqual({
      positionId: "stake-1",
      activeAmount: new BigNumber(5),
      inactiveAmount: new BigNumber(0),
      withdrawableAmount: new BigNumber(2),
      lockedReserve: new BigNumber(7),
      canStake: false,
      canWithdraw: true,
    });
  });

  it("is empty for a stake without uid nor details", () => {
    expect(
      stakingPositionDetails(stake({ uid: "", details: { activeAmount: "x", canStake: "yes" } })),
    ).toEqual({});
    expect(stakingPositionDetails(stake({ uid: "" }))).toEqual({});
  });
});

describe("toStakingPositionOnAccount", () => {
  it("converts the amounts to BigNumber and keeps the rest verbatim", () => {
    expect(
      toStakingPositionOnAccount(
        stake({ amountDeposited: 90n, amountRewarded: 10n, details: { kind: "stake" } }),
      ),
    ).toEqual({
      uid: "stake-1",
      address: "addr",
      delegate: "val1",
      state: "active",
      asset: { type: "native" },
      actions: [],
      amount: new BigNumber(100),
      amountDeposited: new BigNumber(90),
      amountRewarded: new BigNumber(10),
      details: { kind: "stake" },
    });
    expect(toStakingPositionOnAccount(stake())).not.toHaveProperty("amountDeposited");
  });
});

describe("stakingShapeOf", () => {
  it("reports one position per stake for a family using staking positions", () => {
    const shape = stakingShapeOf([stake(), stake({ uid: "stake-2" })], validators, {
      usesStakingPositions: true,
    });

    expect(shape).toEqual({
      stakingPositions: [
        expect.objectContaining({ uid: "stake-1" }),
        expect.objectContaining({ uid: "stake-2" }),
      ],
      delegationsCount: 0,
      unbondingsCount: 0,
    });
    expect(shape).not.toHaveProperty("stakingResources");
  });

  it("builds the delegations, unbondings, totals and validators otherwise", () => {
    const completion = new Date("2026-03-01T00:00:00.000Z");
    const shape = stakingShapeOf(
      [
        stake({
          amountRewarded: 3n,
          details: { validatorId: "id1", validatorName: "Name 1", status: "unbonding" },
        }),
        stake({ uid: "stake-2", state: "activating", delegate: undefined }),
        stake({
          uid: "stake-3",
          state: "deactivating",
          amount: 40n,
          stateUpdatedAt: completion,
          details: { validatorId: "id3", validatorName: "Name 3", withdrawId: 4 },
        }),
        stake({ uid: "stake-4", state: "withdrawable", amount: 1n }),
        stake({ uid: "stake-5", state: "inactive", amount: 2n, actions: ["withdraw"] }),
        stake({ uid: "stake-6", state: "inactive", amount: 3n, actions: ["delegate"] }),
      ],
      validators,
      {},
    );

    expect(shape.delegationsCount).toBe(2);
    expect(shape.unbondingsCount).toBe(4);
    expect(shape.stakingResources).toMatchObject({
      redelegations: [],
      delegatedBalance: new BigNumber(200),
      pendingRewardsBalance: new BigNumber(3),
      unbondingBalance: new BigNumber(46),
      validators,
      delegations: [
        {
          positionId: "stake-1",
          validatorAddress: "val1",
          validatorId: "id1",
          validatorName: "Name 1",
          amount: new BigNumber(100),
          pendingRewards: new BigNumber(3),
          status: "unbonding",
        },
        {
          positionId: "stake-2",
          validatorAddress: "",
          amount: new BigNumber(100),
          pendingRewards: new BigNumber(0),
          status: "activating",
        },
      ],
      unbondings: [
        {
          positionId: "stake-3",
          validatorAddress: "val1",
          validatorId: "id3",
          validatorName: "Name 3",
          withdrawId: 4,
          amount: new BigNumber(40),
          completionDate: completion,
          status: "deactivating",
        },
        expect.objectContaining({ positionId: "stake-4", status: "withdrawable" }),
        expect.objectContaining({ positionId: "stake-5", status: "withdrawable" }),
        expect.objectContaining({ positionId: "stake-6", status: "deactivating" }),
      ],
    });
    expect(shape.stakingResources?.unbondings[1].completionDate).toBeInstanceOf(Date);
  });

  it("reads the shares of a delegation as a decimal string or a bigint, and omits them otherwise", () => {
    const [fromString, fromBigint, absent, invalid] = stakingShapeOf(
      [
        stake({ details: { shares: "123456789012345678901234567890" } }),
        stake({ details: { shares: 42n } }),
        stake(),
        stake({ details: { shares: "not a number" } }),
      ],
      [],
      {},
    ).stakingResources!.delegations;

    expect(fromString.shares).toEqual(new BigNumber("123456789012345678901234567890"));
    expect(fromBigint.shares).toEqual(new BigNumber(42));
    expect(absent).not.toHaveProperty("shares");
    expect(invalid).not.toHaveProperty("shares");
  });

  it("lists no validators when the network has none", () => {
    expect(stakingShapeOf([], [], {}).stakingResources).not.toHaveProperty("validators");
  });
});
