import { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountRaw,
  StakingAccount,
  StakingAccountRaw,
  StakingResources,
  StakingValidatorItem,
} from "@ledgerhq/types-live";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";

const completionDate = new Date("2042-01-02T03:04:05.000Z");

const sampleResources: StakingResources = {
  delegations: [
    {
      validatorAddress: "seivaloper1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx01",
      amount: new BigNumber("1000000000000000000"),
      pendingRewards: new BigNumber("123456789"),
      status: "bonded",
    },
    {
      validatorAddress: "seivaloper1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx02",
      amount: new BigNumber("2000000000000000000"),
      pendingRewards: new BigNumber("0"),
      status: "unbonding",
    },
  ],
  redelegations: [
    {
      validatorSrcAddress: "seivaloper1srcxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      validatorDstAddress: "seivaloper1dstxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      amount: new BigNumber("500000000000000000"),
      completionDate,
    },
  ],
  unbondings: [
    {
      validatorAddress: "seivaloper1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx01",
      amount: new BigNumber("250000000000000000"),
      completionDate,
      withdrawId: 3,
    },
  ],
  delegatedBalance: new BigNumber("3000000000000000000"),
  pendingRewardsBalance: new BigNumber("123456789"),
  unbondingBalance: new BigNumber("250000000000000000"),
};

function roundtrip(resources: StakingResources): StakingResources {
  const account = { stakingResources: resources } as unknown as Account;
  const accountRaw = {} as AccountRaw;
  assignToAccountRaw(account, accountRaw);
  const rehydrated = {} as Account;
  assignFromAccountRaw(accountRaw, rehydrated);
  return (rehydrated as StakingAccount).stakingResources!;
}

function toPlain(r: StakingResources) {
  return {
    delegations: r.delegations.map(d => ({
      validatorAddress: d.validatorAddress,
      amount: d.amount.toString(),
      pendingRewards: d.pendingRewards.toString(),
      status: d.status,
    })),
    redelegations: r.redelegations.map(re => ({
      validatorSrcAddress: re.validatorSrcAddress,
      validatorDstAddress: re.validatorDstAddress,
      amount: re.amount.toString(),
      completionDate: re.completionDate.toISOString(),
    })),
    unbondings: r.unbondings.map(u => ({
      validatorAddress: u.validatorAddress,
      amount: u.amount.toString(),
      completionDate: u.completionDate.toISOString(),
    })),
    delegatedBalance: r.delegatedBalance.toString(),
    pendingRewardsBalance: r.pendingRewardsBalance.toString(),
    unbondingBalance: r.unbondingBalance.toString(),
  };
}

describe("families/evm/serialization", () => {
  describe("assignToAccountRaw / assignFromAccountRaw", () => {
    it("is a no-op when the account has no stakingResources", () => {
      const account = {} as Account;
      const accountRaw = {} as AccountRaw;

      assignToAccountRaw(account, accountRaw);
      expect((accountRaw as StakingAccountRaw).stakingResources).toBeUndefined();

      assignFromAccountRaw(accountRaw, account);
      expect((account as StakingAccount).stakingResources).toBeUndefined();
    });

    it("roundtrips StakingResources without data loss", () => {
      const back = roundtrip(sampleResources);
      expect(toPlain(back)).toEqual(toPlain(sampleResources));
    });

    it("produces BigNumber instances for balances and amounts on the way back", () => {
      const back = roundtrip(sampleResources);
      expect([
        back.delegatedBalance,
        back.pendingRewardsBalance,
        back.unbondingBalance,
        back.delegations[0].amount,
        back.delegations[0].pendingRewards,
        back.redelegations[0].amount,
        back.unbondings[0].amount,
      ]).toEqual(Array(7).fill(expect.any(BigNumber)));
    });

    it("produces Date instances for completion dates on the way back", () => {
      const back = roundtrip(sampleResources);
      expect([back.redelegations[0].completionDate, back.unbondings[0].completionDate]).toEqual(
        Array(2).fill(expect.any(Date)),
      );
    });

    it("roundtrips a Monad unbonding withdrawId (number), omitting it when absent", () => {
      const back = roundtrip(sampleResources);
      expect(back.unbondings[0].withdrawId).toBe(3);

      const noId: StakingResources = {
        ...sampleResources,
        unbondings: [
          {
            validatorAddress: sampleResources.unbondings[0].validatorAddress,
            amount: sampleResources.unbondings[0].amount,
            completionDate: sampleResources.unbondings[0].completionDate,
          },
        ],
      };
      expect(roundtrip(noId).unbondings[0]).not.toHaveProperty("withdrawId");
    });

    it("roundtrips an unbonding status, omitting it when absent", () => {
      const withStatus: StakingResources = {
        ...sampleResources,
        unbondings: [{ ...sampleResources.unbondings[0], status: "deactivating" }],
      };
      expect(roundtrip(withStatus).unbondings[0].status).toBe("deactivating");
      expect(roundtrip(sampleResources).unbondings[0]).not.toHaveProperty("status");
    });

    it("only propagates validators when defined", () => {
      expect(roundtrip(sampleResources)).not.toHaveProperty("validators");
      expect(roundtrip({ ...sampleResources, validators: [] })).toMatchObject({ validators: [] });
    });

    it("roundtrips validators through the assign hooks", () => {
      const validators: StakingValidatorItem[] = [
        {
          validatorAddress: "seivaloper1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx01",
          name: "Validator One",
          votingPower: 0.12,
          commission: 0.05,
          estimatedYearlyRewardsRate: 0.08,
          tokens: "1234567",
        },
      ];
      expect(roundtrip({ ...sampleResources, validators }).validators).toEqual(validators);
    });

    it("roundtrips validatorId and validatorName on delegations and unbondings", () => {
      const resources: StakingResources = {
        ...sampleResources,
        delegations: [
          {
            validatorAddress: "0xValidator",
            validatorId: "7",
            validatorName: "GalaxyDigital",
            amount: new BigNumber("100"),
            pendingRewards: new BigNumber("0"),
            status: "bonded",
          },
        ],
        unbondings: [
          {
            validatorAddress: "0xValidator",
            validatorId: "7",
            validatorName: "GalaxyDigital",
            amount: new BigNumber("50"),
            completionDate,
          },
        ],
      };
      const back = roundtrip(resources);
      expect(back.delegations[0]).toMatchObject({
        validatorId: "7",
        validatorName: "GalaxyDigital",
      });
      expect(back.unbondings[0]).toMatchObject({
        validatorId: "7",
        validatorName: "GalaxyDigital",
      });
    });

    it("omits validatorId and validatorName when absent", () => {
      const back = roundtrip(sampleResources);
      expect(back.delegations[0]).not.toHaveProperty("validatorId");
      expect(back.delegations[0]).not.toHaveProperty("validatorName");
      expect(back.unbondings[0]).not.toHaveProperty("validatorId");
      expect(back.unbondings[0]).not.toHaveProperty("validatorName");
    });

    it("roundtrips a 0G delegation shares (BigNumber), omitting it when absent", () => {
      const resources: StakingResources = {
        ...sampleResources,
        delegations: [
          { ...sampleResources.delegations[0], shares: new BigNumber("999000000000000000000") },
        ],
      };
      const back = roundtrip(resources);
      expect(back.delegations[0].shares).toEqual(new BigNumber("999000000000000000000"));
      expect(roundtrip(sampleResources).delegations[0]).not.toHaveProperty("shares");
    });
  });
});
