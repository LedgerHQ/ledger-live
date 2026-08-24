import { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountRaw,
  StakingAccount,
  StakingAccountRaw,
  StakingResources,
  StakingResourcesRaw,
} from "@ledgerhq/types-live";
import {
  assignStakingResourcesFromAccountRaw,
  assignStakingResourcesToAccountRaw,
  fromStakingResourcesRaw,
  toStakingResourcesRaw,
} from "./staking";

const minimalResources: StakingResources = {
  delegations: [
    {
      validatorAddress: "validator-1",
      amount: new BigNumber(100),
      pendingRewards: new BigNumber(5),
      status: "bonded",
    },
  ],
  redelegations: [],
  unbondings: [],
  delegatedBalance: new BigNumber(100),
  pendingRewardsBalance: new BigNumber(5),
  unbondingBalance: new BigNumber(0),
};

const fullResources: StakingResources = {
  delegations: [
    {
      validatorAddress: "validator-1",
      validatorId: "id-1",
      validatorName: "Validator One",
      amount: new BigNumber(100),
      pendingRewards: new BigNumber(5),
      status: "activating",
      shares: new BigNumber(42),
      positionId: "position-1",
      activeAmount: new BigNumber(80),
      inactiveAmount: new BigNumber(20),
      withdrawableAmount: new BigNumber(15),
      canStake: true,
      canWithdraw: false,
      lockedReserve: new BigNumber(3),
    },
  ],
  redelegations: [
    {
      validatorSrcAddress: "validator-1",
      validatorDstAddress: "validator-2",
      amount: new BigNumber(50),
      completionDate: new Date("2026-01-02T03:04:05.000Z"),
    },
  ],
  unbondings: [
    {
      validatorAddress: "validator-2",
      validatorId: "id-2",
      validatorName: "Validator Two",
      amount: new BigNumber(70),
      completionDate: new Date("2026-02-03T04:05:06.000Z"),
      withdrawId: 7,
      status: "withdrawable",
      positionId: "position-2",
      activeAmount: new BigNumber(0),
      inactiveAmount: new BigNumber(70),
      withdrawableAmount: new BigNumber(70),
      canStake: false,
      canWithdraw: true,
      lockedReserve: new BigNumber(1),
    },
  ],
  delegatedBalance: new BigNumber(100),
  pendingRewardsBalance: new BigNumber(5),
  unbondingBalance: new BigNumber(70),
  validators: [
    {
      validatorAddress: "validator-1",
      validatorId: "id-1",
      name: "Validator One",
      votingPower: 1,
      commission: 0.05,
      estimatedYearlyRewardsRate: 0.07,
      tokens: "1000",
    },
  ],
  actionFeeReserve: new BigNumber(9),
};

describe("staking resources serialization", () => {
  it("roundtrips every field of a fully populated resources object", () => {
    expect(fromStakingResourcesRaw(toStakingResourcesRaw(fullResources))).toEqual(fullResources);
  });

  it("serializes BigNumber and Date fields to JSON-safe primitives", () => {
    const raw = toStakingResourcesRaw(fullResources);

    expect(raw.delegatedBalance).toBe("100");
    expect(raw.actionFeeReserve).toBe("9");
    expect(raw.delegations[0]).toMatchObject({
      amount: "100",
      pendingRewards: "5",
      shares: "42",
      activeAmount: "80",
      inactiveAmount: "20",
      withdrawableAmount: "15",
      lockedReserve: "3",
      canStake: true,
      canWithdraw: false,
    });
    expect(raw.redelegations[0].completionDate).toBe("2026-01-02T03:04:05.000Z");
    expect(raw.unbondings[0]).toMatchObject({
      completionDate: "2026-02-03T04:05:06.000Z",
      withdrawId: "7",
    });
  });

  it("omits absent optional fields instead of writing undefined", () => {
    const raw = toStakingResourcesRaw(minimalResources);

    expect(raw).not.toHaveProperty("validators");
    expect(raw).not.toHaveProperty("actionFeeReserve");
    for (const key of [
      "positionId",
      "activeAmount",
      "inactiveAmount",
      "withdrawableAmount",
      "canStake",
      "canWithdraw",
      "lockedReserve",
      "shares",
      "validatorId",
      "validatorName",
    ]) {
      expect(raw.delegations[0]).not.toHaveProperty(key);
    }
    expect(fromStakingResourcesRaw(raw)).toEqual(minimalResources);
  });

  it("preserves canStake/canWithdraw set to false through a roundtrip", () => {
    const resources: StakingResources = {
      ...minimalResources,
      delegations: [
        {
          ...minimalResources.delegations[0],
          canStake: false,
          canWithdraw: false,
        },
      ],
    };

    const revived = fromStakingResourcesRaw(toStakingResourcesRaw(resources));

    expect(revived.delegations[0].canStake).toBe(false);
    expect(revived.delegations[0].canWithdraw).toBe(false);
  });

  it("defaults missing collections and balances when reviving a partial raw payload", () => {
    const revived = fromStakingResourcesRaw({} as StakingResourcesRaw);

    expect(revived).toEqual({
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    });
  });

  it.each(["not-a-number", "", "   "])(
    "omits a malformed persisted withdrawId (%p) instead of reviving it as NaN",
    withdrawId => {
      const revived = fromStakingResourcesRaw({
        delegations: [],
        redelegations: [],
        unbondings: [
          {
            validatorAddress: "validator-1",
            amount: "10",
            completionDate: "2026-02-03T04:05:06.000Z",
            withdrawId,
          },
        ],
        delegatedBalance: "0",
        pendingRewardsBalance: "0",
        unbondingBalance: "10",
      });

      expect(revived.unbondings[0]).not.toHaveProperty("withdrawId");
    },
  );

  it("revives a well-formed persisted withdrawId, including 0", () => {
    const raw = toStakingResourcesRaw({
      ...minimalResources,
      unbondings: [
        {
          validatorAddress: "validator-1",
          amount: new BigNumber(10),
          completionDate: new Date("2026-02-03T04:05:06.000Z"),
          withdrawId: 0,
        },
      ],
    });

    expect(raw.unbondings[0].withdrawId).toBe("0");
    expect(fromStakingResourcesRaw(raw).unbondings[0].withdrawId).toBe(0);
  });

  it("assigns resources in both directions on an account", () => {
    const account = { stakingResources: fullResources } as unknown as Account;
    const accountRaw = {} as AccountRaw;
    assignStakingResourcesToAccountRaw(account, accountRaw);

    const revivedAccount = {} as Account;
    assignStakingResourcesFromAccountRaw(accountRaw, revivedAccount);

    expect((accountRaw as StakingAccountRaw).stakingResources).toBeDefined();
    expect((revivedAccount as StakingAccount).stakingResources).toEqual(fullResources);
  });

  it("leaves the target untouched when there is nothing to assign", () => {
    const accountRaw = {} as AccountRaw;
    assignStakingResourcesToAccountRaw({} as Account, accountRaw);
    expect(accountRaw).not.toHaveProperty("stakingResources");

    const account = {} as Account;
    assignStakingResourcesFromAccountRaw({} as AccountRaw, account);
    expect(account).not.toHaveProperty("stakingResources");
  });
});
