import { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountRaw,
  StakingAccount,
  StakingAccountRaw,
  StakingDelegation,
  StakingDelegationRaw,
  StakingRedelegation,
  StakingRedelegationRaw,
  StakingResources,
  StakingResourcesRaw,
  StakingUnbonding,
  StakingUnbondingRaw,
} from "@ledgerhq/types-live";

function toStakingDelegationRaw(d: StakingDelegation): StakingDelegationRaw {
  return {
    validatorAddress: d.validatorAddress,
    amount: d.amount.toString(),
    pendingRewards: d.pendingRewards.toString(),
    status: d.status,
  };
}

function fromStakingDelegationRaw(d: StakingDelegationRaw): StakingDelegation {
  return {
    validatorAddress: d.validatorAddress,
    amount: new BigNumber(d.amount),
    pendingRewards: new BigNumber(d.pendingRewards),
    status: d.status,
  };
}

function toStakingRedelegationRaw(r: StakingRedelegation): StakingRedelegationRaw {
  return {
    validatorSrcAddress: r.validatorSrcAddress,
    validatorDstAddress: r.validatorDstAddress,
    amount: r.amount.toString(),
    completionDate: r.completionDate.toISOString(),
  };
}

function fromStakingRedelegationRaw(r: StakingRedelegationRaw): StakingRedelegation {
  return {
    validatorSrcAddress: r.validatorSrcAddress,
    validatorDstAddress: r.validatorDstAddress,
    amount: new BigNumber(r.amount),
    completionDate: new Date(r.completionDate),
  };
}

function toStakingUnbondingRaw(u: StakingUnbonding): StakingUnbondingRaw {
  return {
    validatorAddress: u.validatorAddress,
    amount: u.amount.toString(),
    completionDate: u.completionDate.toISOString(),
  };
}

function fromStakingUnbondingRaw(u: StakingUnbondingRaw): StakingUnbonding {
  return {
    validatorAddress: u.validatorAddress,
    amount: new BigNumber(u.amount),
    completionDate: new Date(u.completionDate),
  };
}

/**
 * Serialize only the `stakingResources` slice of an EVM account.
 *
 * Required `StakingResources` fields are serialized unconditionally. Optional
 * fields are propagated conditionally (for example `validators`), while
 * `fromStakingResourcesRaw` remains tolerant of missing keys from legacy raw
 * payloads by applying defaults during deserialization.
 */
export function toStakingResourcesRaw(r: StakingResources): StakingResourcesRaw {
  const raw: StakingResourcesRaw = {
    delegations: r.delegations.map(toStakingDelegationRaw),
    redelegations: r.redelegations.map(toStakingRedelegationRaw),
    unbondings: r.unbondings.map(toStakingUnbondingRaw),
    delegatedBalance: r.delegatedBalance.toString(),
    pendingRewardsBalance: r.pendingRewardsBalance.toString(),
    unbondingBalance: r.unbondingBalance.toString(),
  };

  if (r.validators !== undefined) {
    raw.validators = r.validators;
  }

  return raw;
}

export function fromStakingResourcesRaw(r: StakingResourcesRaw): StakingResources {
  const resources: StakingResources = {
    delegations: (r.delegations ?? []).map(fromStakingDelegationRaw),
    redelegations: (r.redelegations ?? []).map(fromStakingRedelegationRaw),
    unbondings: (r.unbondings ?? []).map(fromStakingUnbondingRaw),
    delegatedBalance: new BigNumber(r.delegatedBalance ?? "0"),
    pendingRewardsBalance: new BigNumber(r.pendingRewardsBalance ?? "0"),
    unbondingBalance: new BigNumber(r.unbondingBalance ?? "0"),
  };

  if (r.validators !== undefined) {
    resources.validators = r.validators;
  }

  return resources;
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const stakingAccount = account as StakingAccount;
  if (stakingAccount.stakingResources) {
    (accountRaw as StakingAccountRaw).stakingResources = toStakingResourcesRaw(
      stakingAccount.stakingResources,
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  const stakingResourcesRaw = (accountRaw as StakingAccountRaw).stakingResources;
  if (stakingResourcesRaw) {
    (account as StakingAccount).stakingResources = fromStakingResourcesRaw(stakingResourcesRaw);
  }
}
