import { BigNumber } from "bignumber.js";
import {
  type CosmosResourcesRaw,
  type CosmosResources,
  type CosmosAccountRaw,
  type CosmosAccount,
  isCosmosOperationExtraRaw,
  CosmosOperationExtra,
  CosmosOperationExtraRaw,
} from "./types";
import { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";

export function toCosmosResourcesRaw(r: CosmosResources): CosmosResourcesRaw {
  const {
    delegatedBalance,
    delegations,
    pendingRewardsBalance,
    unbondingBalance,
    withdrawAddress,
    redelegations,
    unbondings,
    sequence,
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
    withdrawAddress,
    sequence,
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
    sequence,
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
    withdrawAddress,
    sequence,
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const cosmosAccount = account as CosmosAccount;
  if (cosmosAccount.cosmosResources) {
    (accountRaw as CosmosAccountRaw).cosmosResources = toCosmosResourcesRaw(
      cosmosAccount.cosmosResources,
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const cosmosResourcesRaw = (accountRaw as CosmosAccountRaw).cosmosResources;
  if (cosmosResourcesRaw)
    (account as CosmosAccount).cosmosResources = fromCosmosResourcesRaw(cosmosResourcesRaw);
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
