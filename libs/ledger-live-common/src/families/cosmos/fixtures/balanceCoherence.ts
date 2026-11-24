import { isStakingAccount, type Account, type StakingAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";

export const balancesAreCoherent = (account: Account): boolean[] => {
  invariant(isStakingAccount(account), "a staking account is expected");
  const { delegatedBalance, unbondingBalance } = account.stakingResources;
  return [
    account.balance.isEqualTo(
      account.spendableBalance.plus(delegatedBalance).plus(unbondingBalance),
    ),
    account.spendableBalance.isLessThanOrEqualTo(account.balance),
    delegatedBalance.isGreaterThanOrEqualTo(0),
    unbondingBalance.isGreaterThanOrEqualTo(0),
  ];
};

export const withSentinelBalances = (account: Account): StakingAccount => {
  invariant(isStakingAccount(account), "a staking account is expected");
  return {
    ...account,
    balance: new BigNumber(-1),
    spendableBalance: new BigNumber(-1),
    operations: [],
    operationsCount: 0,
    stakingResources: {
      ...account.stakingResources,
      delegatedBalance: new BigNumber(-1),
      unbondingBalance: new BigNumber(-1),
    },
  };
};
