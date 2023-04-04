import { BigNumber } from "bignumber.js";
import type {
  CosmosResourcesRaw,
  CosmosResources,
  CosmosAccountRaw,
  CosmosAccount,
} from "./types";
import { Account, AccountRaw } from "@ledgerhq/types-live";

export function toCosmosResourcesRaw(r: CosmosResources): CosmosResourcesRaw {
  const {
    delegatedBalance,
    delegations,
    pendingRewardsBalance,
    unbondingBalance,
    withdrawAddress,
    redelegations,
    unbondings,
  } = r;

  return {
    delegations: delegations.map(
      ({ amount, status, pendingRewards, validatorAddress }) => ({
        amount: amount.toString(),
        status,
        pendingRewards: pendingRewards.toString(),
        validatorAddress,
      })
    ),
    redelegations: redelegations.map(
      ({
        amount,
        completionDate,
        validatorSrcAddress,
        validatorDstAddress,
      }) => ({
        amount: amount.toString(),
        completionDate: completionDate.toString(),
        validatorSrcAddress,
        validatorDstAddress,
      })
    ),
    unbondings: unbondings.map(
      ({ amount, completionDate, validatorAddress }) => ({
        amount: amount.toString(),
        completionDate: completionDate.toString(),
        validatorAddress,
      })
    ),
    delegatedBalance: delegatedBalance.toString(),
    pendingRewardsBalance: pendingRewardsBalance.toString(),
    unbondingBalance: unbondingBalance.toString(),
    withdrawAddress,
  };
}
export function fromCosmosResourcesRaw(r: CosmosResourcesRaw): CosmosResources {
  const {
    delegatedBalance,
    delegations,
    pendingRewardsBalance,
    redelegations,
    unbondingBalance,
    withdrawAddress,
    unbondings,
  } = r;
  return {
    delegations: delegations.map(
      ({ amount, status, pendingRewards, validatorAddress }) => ({
        amount: new BigNumber(amount),
        status,
        pendingRewards: new BigNumber(pendingRewards),
        validatorAddress,
      })
    ),
    redelegations: redelegations.map(
      ({
        amount,
        completionDate,
        validatorSrcAddress,
        validatorDstAddress,
      }) => ({
        amount: new BigNumber(amount),
        completionDate: new Date(completionDate),
        validatorSrcAddress,
        validatorDstAddress,
      })
    ),
    unbondings: unbondings.map(
      ({ amount, completionDate, validatorAddress }) => ({
        amount: new BigNumber(amount),
        completionDate: new Date(completionDate),
        validatorAddress,
      })
    ),
    delegatedBalance: new BigNumber(delegatedBalance),
    pendingRewardsBalance: new BigNumber(pendingRewardsBalance),
    unbondingBalance: new BigNumber(unbondingBalance),
    withdrawAddress,
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const cosmosAccount = account as CosmosAccount;
  if (cosmosAccount.cosmosResources) {
    (accountRaw as CosmosAccountRaw).cosmosResources = toCosmosResourcesRaw(
      cosmosAccount.cosmosResources
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const cosmosResourcesRaw = (accountRaw as CosmosAccountRaw).cosmosResources;
  if (cosmosResourcesRaw)
    (account as CosmosAccount).cosmosResources =
      fromCosmosResourcesRaw(cosmosResourcesRaw);
}
