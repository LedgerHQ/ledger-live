import {
  Account,
  AccountRaw,
  OperationExtra,
  OperationExtraRaw,
  StakingAccount,
  StakingResources,
} from "@ledgerhq/types-live";
import {
  assignStakingResourcesFromAccountRaw,
  assignStakingResourcesToAccountRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import { BigNumber } from "bignumber.js";
import {
  CosmosOperationExtra,
  CosmosOperationExtraRaw,
  isCosmosOperationExtraRaw,
  type CosmosAccount,
  type CosmosAccountRaw,
  type CosmosResourcesRaw,
} from "./types";

function parseLegacyCosmosResourcesRaw(r: CosmosResourcesRaw): StakingResources {
  return {
    delegations: r.delegations.map(({ amount, status, pendingRewards, validatorAddress }) => ({
      amount: new BigNumber(amount),
      status,
      pendingRewards: new BigNumber(pendingRewards),
      validatorAddress,
    })),
    redelegations: r.redelegations.map(
      ({ amount, completionDate, validatorSrcAddress, validatorDstAddress }) => ({
        amount: new BigNumber(amount),
        completionDate: new Date(completionDate),
        validatorSrcAddress,
        validatorDstAddress,
      }),
    ),
    unbondings: r.unbondings.map(({ amount, completionDate, validatorAddress }) => ({
      amount: new BigNumber(amount),
      completionDate: new Date(completionDate),
      validatorAddress,
    })),
    delegatedBalance: new BigNumber(r.delegatedBalance),
    pendingRewardsBalance: new BigNumber(r.pendingRewardsBalance),
    unbondingBalance: new BigNumber(r.unbondingBalance),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  assignStakingResourcesToAccountRaw(account, accountRaw);
  (accountRaw as CosmosAccountRaw).sequence = (account as CosmosAccount).sequence;
}

/**
 * Accounts persisted before the generic adapter keep their staking data in `cosmosResources` and
 * their sequence in `cosmosResources`/`stakingResources`: read them so those accounts still load.
 */
export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  assignStakingResourcesFromAccountRaw(accountRaw, account);
  const { sequence, stakingResources, cosmosResources } = accountRaw as CosmosAccountRaw;
  const cosmosAccount = account as CosmosAccount;

  cosmosAccount.sequence = sequence ?? stakingResources?.sequence ?? cosmosResources?.sequence ?? 0;

  // The compressed public key used to live in the resources; `xpub` holds it now. Only accounts
  // whose `xpub` is still the plain address (synced before the key was persisted) are migrated.
  const legacyPublicKey = stakingResources?.publicKey || cosmosResources?.publicKey;
  if (legacyPublicKey && (!account.xpub || account.xpub === account.freshAddress)) {
    account.xpub = legacyPublicKey;
  }

  if (!stakingResources && cosmosResources) {
    (account as StakingAccount).stakingResources = parseLegacyCosmosResourcesRaw(cosmosResources);
  }
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
