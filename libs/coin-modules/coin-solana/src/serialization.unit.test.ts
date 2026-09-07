import { BigNumber } from "bignumber.js";
import type { Account, AccountRaw, StakingAccount } from "@ledgerhq/types-live";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";

describe("solana account serialization", () => {
  it("roundtrips stakingResources", () => {
    const account = {
      stakingResources: {
        delegations: [
          {
            positionId: "stake-1",
            validatorAddress: "vote-1",
            amount: new BigNumber(100),
            pendingRewards: new BigNumber(0),
            status: "bonded",
            canStake: true,
            canWithdraw: true,
          },
        ],
        redelegations: [],
        unbondings: [],
        delegatedBalance: new BigNumber(100),
        pendingRewardsBalance: new BigNumber(0),
        unbondingBalance: new BigNumber(0),
        actionFeeReserve: new BigNumber(5),
      },
    } as unknown as Account;
    const accountRaw = {} as AccountRaw;
    assignToAccountRaw(account, accountRaw);
    const rehydrated = {} as Account;
    assignFromAccountRaw(accountRaw, rehydrated);
    expect((rehydrated as StakingAccount).stakingResources?.delegations[0].positionId).toBe(
      "stake-1",
    );
    expect((rehydrated as StakingAccount).stakingResources?.actionFeeReserve).toEqual(
      new BigNumber(5),
    );
  });

  it("migrates a persisted solanaResources blob to stakingResources", () => {
    const accountRaw = {
      solanaResources: {
        stakes: JSON.stringify([
          {
            stakeAccAddr: "stake-legacy",
            hasStakeAuth: true,
            hasWithdrawAuth: true,
            delegation: { stake: 50, voteAccAddr: "vote-legacy" },
            stakeAccBalance: 60,
            rentExemptReserve: 10,
            withdrawable: 0,
            activation: { state: "active", active: 50, inactive: 0 },
          },
        ]),
        unstakeReserve: "3",
      },
    } as unknown as AccountRaw;
    const account = {} as Account;
    assignFromAccountRaw(accountRaw, account);
    const resources = (account as StakingAccount).stakingResources;
    expect(resources?.delegations[0].positionId).toBe("stake-legacy");
    expect(resources?.actionFeeReserve).toEqual(new BigNumber(3));
  });

  it.each([["not json"], [JSON.stringify({ notAnArray: true })]])(
    "falls back to empty resources when the persisted blob is unusable",
    stakes => {
      const accountRaw = {
        solanaResources: { stakes, unstakeReserve: "3" },
      } as unknown as AccountRaw;
      const account = {} as Account;

      expect(() => assignFromAccountRaw(accountRaw, account)).not.toThrow();

      const resources = (account as StakingAccount).stakingResources;
      expect(resources?.delegations).toEqual([]);
      expect(resources?.unbondings).toEqual([]);
      expect(resources?.actionFeeReserve).toEqual(new BigNumber(3));
    },
  );

  it.each([
    ["a stake with no activation", { stakeAccAddr: "a", withdrawable: 0, rentExemptReserve: 0 }],
    [
      "a stake with an unknown activation state",
      {
        stakeAccAddr: "b",
        withdrawable: 0,
        rentExemptReserve: 0,
        activation: { state: "wat", active: 0, inactive: 0 },
      },
    ],
  ])("falls back to empty resources when the blob contains %s", (_label, stake) => {
    const accountRaw = {
      solanaResources: { stakes: JSON.stringify([stake]), unstakeReserve: "3" },
    } as unknown as AccountRaw;
    const account = {} as Account;

    expect(() => assignFromAccountRaw(accountRaw, account)).not.toThrow();

    const resources = (account as StakingAccount).stakingResources;
    expect(resources?.delegations).toEqual([]);
    expect(resources?.unbondings).toEqual([]);
    expect(resources?.actionFeeReserve).toEqual(new BigNumber(3));
  });

  it.each([[undefined], [null], ["not-a-number"], [-1], [{ corrupted: true }]])(
    "defaults actionFeeReserve to 0 when persisted unstakeReserve is unusable",
    unstakeReserve => {
      const accountRaw = {
        solanaResources: { stakes: "[]", unstakeReserve },
      } as unknown as AccountRaw;
      const account = {} as Account;

      expect(() => assignFromAccountRaw(accountRaw, account)).not.toThrow();
      expect((account as StakingAccount).stakingResources?.actionFeeReserve).toEqual(
        new BigNumber(0),
      );
    },
  );
});
