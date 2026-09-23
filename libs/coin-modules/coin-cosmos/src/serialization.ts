import { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import {
  CosmosOperationExtra,
  CosmosOperationExtraRaw,
  isCosmosOperationExtraRaw,
  type CosmosAccount,
  type CosmosAccountRaw,
  type CosmosDelegationStatus,
  type CosmosResources,
  type CosmosResourcesRaw,
  type LegacyCosmosResourcesFields,
} from "./types";
import {
  type StakingDelegationStatus,
  type StakingResources,
  type StakingResourcesRaw,
} from "@ledgerhq/types-live";

function toResourcesRaw<Status extends string>(
  r: ResourcesShape<Status>,
): ResourcesRawShape<Status> {
  const {
    delegatedBalance,
    delegations,
    pendingRewardsBalance,
    unbondingBalance,
    redelegations,
    unbondings,
    sequence,
    publicKey,
  } = r;

  return {
    delegations: delegations.map(({ amount, status, pendingRewards, validatorAddress }) => ({
      amount: amount.toString(),
      status,
      pendingRewards: pendingRewards.toString(),
      validatorAddress,
    })),
    redelegations: redelegations.map(
      ({ amount, completionDate, validatorSrcAddress, validatorDstAddress }) => ({
        amount: amount.toString(),
        completionDate: completionDate.toString(),
        validatorSrcAddress,
        validatorDstAddress,
      }),
    ),
    unbondings: unbondings.map(({ amount, completionDate, validatorAddress }) => ({
      amount: amount.toString(),
      completionDate: completionDate.toString(),
      validatorAddress,
    })),
    delegatedBalance: delegatedBalance.toString(),
    pendingRewardsBalance: pendingRewardsBalance.toString(),
    unbondingBalance: unbondingBalance.toString(),
    ...(sequence !== undefined ? { sequence } : {}),
    ...(publicKey !== undefined ? { publicKey } : {}),
  };
}
type ResourcesRawShape<Status extends string> = {
  delegations: {
    amount: string;
    status: Status;
    pendingRewards: string;
    validatorAddress: string;
  }[];
  redelegations: {
    amount: string;
    completionDate: string;
    validatorSrcAddress: string;
    validatorDstAddress: string;
  }[];
  unbondings: { amount: string; completionDate: string; validatorAddress: string }[];
  delegatedBalance: string;
  pendingRewardsBalance: string;
  unbondingBalance: string;
} & LegacyCosmosResourcesFields;

type ResourcesShape<Status extends string> = {
  delegations: {
    amount: BigNumber;
    status: Status;
    pendingRewards: BigNumber;
    validatorAddress: string;
  }[];
  redelegations: {
    amount: BigNumber;
    completionDate: Date;
    validatorSrcAddress: string;
    validatorDstAddress: string;
  }[];
  unbondings: { amount: BigNumber; completionDate: Date; validatorAddress: string }[];
  delegatedBalance: BigNumber;
  pendingRewardsBalance: BigNumber;
  unbondingBalance: BigNumber;
} & LegacyCosmosResourcesFields;

function parseResourcesRaw<Status extends string>(
  r: ResourcesRawShape<Status>,
): ResourcesShape<Status> {
  const {
    delegatedBalance,
    delegations,
    pendingRewardsBalance,
    redelegations,
    unbondingBalance,
    unbondings,
    sequence,
    publicKey,
  } = r;
  return {
    delegations: delegations.map(({ amount, status, pendingRewards, validatorAddress }) => ({
      amount: new BigNumber(amount),
      status,
      pendingRewards: new BigNumber(pendingRewards),
      validatorAddress,
    })),
    redelegations: redelegations.map(
      ({ amount, completionDate, validatorSrcAddress, validatorDstAddress }) => ({
        amount: new BigNumber(amount),
        completionDate: new Date(completionDate),
        validatorSrcAddress,
        validatorDstAddress,
      }),
    ),
    unbondings: unbondings.map(({ amount, completionDate, validatorAddress }) => ({
      amount: new BigNumber(amount),
      completionDate: new Date(completionDate),
      validatorAddress,
    })),
    delegatedBalance: new BigNumber(delegatedBalance),
    pendingRewardsBalance: new BigNumber(pendingRewardsBalance),
    unbondingBalance: new BigNumber(unbondingBalance),
    ...(sequence !== undefined ? { sequence } : {}),
    ...(publicKey !== undefined ? { publicKey } : {}),
  };
}

function fromCosmosResourcesRaw(r: CosmosResourcesRaw): CosmosResources {
  return parseResourcesRaw<CosmosDelegationStatus>(r);
}

function createEmptyCosmosResources(): CosmosResources {
  return {
    delegations: [],
    redelegations: [],
    unbondings: [],
    delegatedBalance: new BigNumber(0),
    pendingRewardsBalance: new BigNumber(0),
    unbondingBalance: new BigNumber(0),
  };
}

function fromStakingResourcesRaw(
  r: StakingResourcesRaw & LegacyCosmosResourcesFields,
): StakingResources & LegacyCosmosResourcesFields {
  return parseResourcesRaw<StakingDelegationStatus>(r);
}

function toCosmosResourcesRaw(r: CosmosResources): CosmosResourcesRaw {
  return toResourcesRaw<CosmosDelegationStatus>(r);
}

function toStakingResourcesRaw(
  r: StakingResources & LegacyCosmosResourcesFields,
): StakingResourcesRaw & LegacyCosmosResourcesFields {
  return toResourcesRaw<StakingDelegationStatus>(r);
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const cosmosAccount = account as CosmosAccount;
  const cosmosAccountRaw = accountRaw as CosmosAccountRaw;
  if (cosmosAccount.stakingResources) {
    cosmosAccountRaw.stakingResources = toStakingResourcesRaw(cosmosAccount.stakingResources);
  }
  if (cosmosAccount.cosmosResources) {
    cosmosAccountRaw.cosmosResources = toCosmosResourcesRaw(cosmosAccount.cosmosResources);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const cosmosAccountRaw = accountRaw as CosmosAccountRaw;
  const cosmosAccount = account as CosmosAccount;

  cosmosAccount.cosmosResources = cosmosAccountRaw.cosmosResources
    ? fromCosmosResourcesRaw(cosmosAccountRaw.cosmosResources)
    : createEmptyCosmosResources();

  cosmosAccount.stakingResources = cosmosAccountRaw.stakingResources
    ? fromStakingResourcesRaw(cosmosAccountRaw.stakingResources)
    : { ...cosmosAccount.cosmosResources };
}

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw): OperationExtra {
  const extra: CosmosOperationExtra = {};
  if (!isCosmosOperationExtraRaw(extraRaw)) {
    return extra;
  }

  if (extraRaw.validator) {
    extra.validator = {
      address: extraRaw.validator.address,
      amount: new BigNumber(extraRaw.validator.amount),
    };
  }

  if (extraRaw.validators && extraRaw.validators.length > 0) {
    extra.validators = extraRaw.validators.map(validator => ({
      address: validator.address,
      amount: new BigNumber(validator.amount),
    }));
  }

  if (extraRaw.sourceValidator) {
    extra.sourceValidator = extraRaw.sourceValidator;
  }

  if (extraRaw.autoClaimedRewards) {
    extra.autoClaimedRewards = extraRaw.autoClaimedRewards;
  }

  if (extraRaw.memo) {
    extra.memo = extraRaw.memo;
  }

  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra): OperationExtraRaw {
  const extraRaw: CosmosOperationExtraRaw = {};
  if (!isCosmosOperationExtraRaw(extra)) {
    return extraRaw;
  }

  if (extra.validator) {
    extraRaw.validator = {
      address: extra.validator.address,
      amount: extra.validator.amount.toString(),
    };
  }

  if (extra.validators && extra.validators.length > 0) {
    extraRaw.validators = extra.validators.map(validator => ({
      address: validator.address,
      amount: validator.amount.toString(),
    }));
  }

  if (extra.sourceValidator) {
    extraRaw.sourceValidator = extra.sourceValidator;
  }

  if (extra.autoClaimedRewards) {
    extraRaw.autoClaimedRewards = extra.autoClaimedRewards;
  }

  if (extra.memo) {
    extraRaw.memo = extra.memo;
  }

  return extraRaw;
}
