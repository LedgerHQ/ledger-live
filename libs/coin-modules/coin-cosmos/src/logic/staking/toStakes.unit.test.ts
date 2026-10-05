import BigNumber from "bignumber.js";
import { buildStakes } from "./toStakes";

describe("logic/staking/toStakes", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("maps a bonded delegation to an active stake with principal amount", () => {
    const [s] = buildStakes("cosmos1a", {
      delegations: [
        {
          validatorAddress: "cosmosvaloper1v",
          amount: new BigNumber("1000000"),
          pendingRewards: new BigNumber("2500"),
          status: "bonded",
        },
      ],
      unbondings: [],
    } as any);
    expect(s.state).toBe("active");
    expect(s.delegate).toBe("cosmosvaloper1v");
    expect(s.amount).toBe(1_000_000n); // principal, excludes rewards
    expect(s.amountDeposited).toBe(1_000_000n);
    expect(s.amountRewarded).toBe(2_500n);
    expect(s.actions).toContain("claim_reward");
    expect(s.details).toEqual({ status: "bonded" });
  });

  it("keeps a delegation to a non-bonded validator as an active position (matches legacy inclusion)", () => {
    const [s] = buildStakes("cosmos1a", {
      delegations: [
        {
          validatorAddress: "cosmosvaloper1v",
          amount: new BigNumber("1000000"),
          pendingRewards: new BigNumber("0"),
          status: "unbonding",
        },
      ],
      unbondings: [],
    } as any);
    expect(s.state).toBe("active");
    expect(s.details).toEqual({ status: "unbonding" });
  });

  it("carries an unbonded validator status through to the pushed stake's details", () => {
    const [s] = buildStakes("cosmos1a", {
      delegations: [
        {
          validatorAddress: "cosmosvaloper1v",
          amount: new BigNumber("1000000"),
          pendingRewards: new BigNumber("0"),
          status: "unbonded",
        },
      ],
      unbondings: [],
    } as any);
    expect(s.state).toBe("active");
    expect(s.details).toEqual({ status: "unbonded" });
  });

  it("maps an in-progress unbonding to a deactivating stake carrying its completion date", () => {
    const completionDate = new Date(Date.now() + 86_400_000);
    const [s] = buildStakes("cosmos1a", {
      delegations: [],
      unbondings: [
        {
          validatorAddress: "cosmosvaloper1v",
          amount: new BigNumber("500000"),
          completionDate,
        },
      ],
    } as any);
    expect(s.state).toBe("deactivating");
    // the framework surfaces stateUpdatedAt as the unbonding's completionDate
    expect(s.stateUpdatedAt).toEqual(completionDate);
    expect(s.amount).toBe(500_000n);
    expect(s.amountRewarded).toBe(0n);
  });

  it("maps a completed unbonding to a withdrawable stake", () => {
    const completionDate = new Date(Date.now() - 86_400_000);
    const [s] = buildStakes("cosmos1a", {
      delegations: [],
      unbondings: [
        { validatorAddress: "cosmosvaloper1v", amount: new BigNumber("500000"), completionDate },
      ],
    } as any);
    expect(s.state).toBe("withdrawable");
    expect(s.actions).toEqual([]);
    expect(s.stateUpdatedAt).toEqual(completionDate);
  });

  it("treats an unbonding completing exactly now as withdrawable", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const [s] = buildStakes("cosmos1a", {
      delegations: [],
      unbondings: [
        {
          validatorAddress: "cosmosvaloper1v",
          amount: new BigNumber("1"),
          completionDate: new Date(Date.now()),
        },
      ],
    } as any);
    expect(s.state).toBe("withdrawable");
  });

  it("does not offer claim_reward when there are no pending rewards", () => {
    const [s] = buildStakes("cosmos1a", {
      delegations: [
        {
          validatorAddress: "cosmosvaloper1v",
          amount: new BigNumber("1000000"),
          pendingRewards: new BigNumber("0"),
          status: "bonded",
        },
      ],
      unbondings: [],
    } as any);
    expect(s.actions).toEqual(["undelegate", "redelegate"]);
    expect(s.amountRewarded).toBe(0n);
  });

  it.each(["bonded", "unbonding", "unbonded", "unspecified"])(
    "passes the %s validator status through to details and keeps the stake active",
    status => {
      const [s] = buildStakes("cosmos1a", {
        delegations: [
          {
            validatorAddress: "cosmosvaloper1v",
            amount: new BigNumber("1000000"),
            pendingRewards: new BigNumber("0"),
            status,
          },
        ],
        unbondings: [],
      } as any);
      expect(s.state).toBe("active");
      expect(s.details).toEqual({ status });
    },
  );

  it("builds stable uids, orders delegations before unbondings, and returns [] for empty input", () => {
    const completionDate = new Date(Date.now() + 86_400_000);
    const items = buildStakes("cosmos1a", {
      delegations: [
        {
          validatorAddress: "cosmosvaloper1v",
          amount: new BigNumber("1"),
          pendingRewards: new BigNumber("0"),
          status: "bonded",
        },
      ],
      unbondings: [
        { validatorAddress: "cosmosvaloper1w", amount: new BigNumber("2"), completionDate },
      ],
    } as any);
    expect(items.map(i => i.uid)).toEqual([
      "cosmos1a:cosmosvaloper1v",
      `cosmos1a:cosmosvaloper1w:unbonding:${completionDate.getTime()}`,
    ]);
    expect(buildStakes("cosmos1a", { delegations: [], unbondings: [] })).toEqual([]);
  });
});
