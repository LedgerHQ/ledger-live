import BigNumber from "bignumber.js";
import type { StakingAccount } from "../types";
import { getMaxEstimatedBalance } from "./logic";

describe("evm staking logic", () => {
  describe("getMaxEstimatedBalance", () => {
    it("uses the spendable balance without subtracting staked resources again", () => {
      const account = {
        balance: new BigNumber("3062112500000000000"),
        spendableBalance: new BigNumber("3062112500000000000"),
        stakingResources: {
          delegations: [],
          redelegations: [],
          unbondings: [],
          delegatedBalance: new BigNumber("3000000000000000000"),
          pendingRewardsBalance: new BigNumber(0),
          unbondingBalance: new BigNumber(0),
        },
      } as unknown as StakingAccount;

      expect(getMaxEstimatedBalance(account, new BigNumber("100000000000000000"))).toEqual(
        new BigNumber("2962112500000000000"),
      );
    });

    it("returns zero when fees exceed spendable balance", () => {
      const account = {
        balance: new BigNumber("1000"),
        spendableBalance: new BigNumber("500"),
        stakingResources: {
          delegations: [],
          redelegations: [],
          unbondings: [],
          delegatedBalance: new BigNumber(0),
          pendingRewardsBalance: new BigNumber(0),
          unbondingBalance: new BigNumber(0),
        },
      } as unknown as StakingAccount;

      expect(getMaxEstimatedBalance(account, new BigNumber("600"))).toEqual(new BigNumber(0));
    });
  });
});
