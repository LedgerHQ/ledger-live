import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import {
  NotEnoughBalance,
  InvalidAddressBecauseDestinationIsAlsoSource,
  InvalidAddress,
  AmountRequired,
  RecommendUndelegation,
  FeeNotLoaded,
} from "@ledgerhq/errors";
import {
  CosmosRedelegationInProgress,
  ClaimRewardsFeesWarning,
  CosmosDelegateAllFundsWarning,
  CosmosTooManyValidators,
  NotEnoughDelegationBalance,
} from "../../errors";
import {
  getMaxEstimatedBalance,
  COSMOS_MAX_REDELEGATIONS,
  COSMOS_MAX_UNBONDINGS,
  COSMOS_MAX_DELEGATIONS,
} from "./logic";
import { validateRecipient } from "../../bridge/shared";
import { Transaction, TransactionStatus, StatusErrorMap } from "./types";
import { Account } from "../../types";

const isDelegable = (
  a: Account,
  address: string | undefined | null,
  amount: BigNumber
) => {
  const { cosmosResources } = a;
  invariant(cosmosResources, "cosmosResources should exist");

  if (
    cosmosResources &&
    cosmosResources.delegations.some(
      (delegation) =>
        delegation.validatorAddress === address && delegation.amount.lt(amount)
    )
  ) {
    return new NotEnoughDelegationBalance();
  }

  return null;
};

const redelegationStatusError = (a: Account, t: Transaction) => {
  if (a.cosmosResources) {
    const redelegations = a.cosmosResources.redelegations;
    invariant(
      redelegations.length < COSMOS_MAX_REDELEGATIONS,
      "redelegation should not have more than 6 entries"
    );
    if (
      redelegations.some((redelegation) => {
        const dstValidator = redelegation.validatorDstAddress;
        return (
          dstValidator === t.cosmosSourceValidator &&
          redelegation.completionDate > new Date()
        );
      })
    )
      return new CosmosRedelegationInProgress();
    if (t.cosmosSourceValidator === t.validators[0].address)
      return new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  return isDelegable(a, t.cosmosSourceValidator, t.validators[0].amount);
};

const getSendTransactionStatus = async (
  a: Account,
  t: Transaction,
  isPreValidation = false
): Promise<TransactionStatus> => {
  const errors: StatusErrorMap = {};
  const warnings: StatusErrorMap = {};

  if (a.freshAddress === t.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else {
    const { recipientError, recipientWarning } = await validateRecipient(
      a.currency,
      t.recipient
    );

    if (recipientError) {
      errors.recipient = recipientError;
    }

    if (recipientWarning) {
      warnings.recipient = recipientWarning;
    }
  }

  let amount = t.amount;

  if (amount.lte(0) && !t.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  const estimatedFees = t.fees || new BigNumber(0);

  if (!isPreValidation && (!t.fees || !t.fees.gt(0))) {
    errors.fees = new FeeNotLoaded();
  }

  amount = t.useAllAmount ? getMaxEstimatedBalance(a, estimatedFees) : amount;
  const totalSpent = amount.plus(estimatedFees);

  if (
    (amount.lte(0) && t.useAllAmount) || // if use all Amount sets an amount at 0
    (!errors.recipient && !errors.amount && totalSpent.gt(a.spendableBalance)) // if spendable balance lower than total
  ) {
    errors.amount = new NotEnoughBalance();
  }

  if (
    a.cosmosResources &&
    a.cosmosResources.delegations.length > 0 &&
    t.useAllAmount
  ) {
    warnings.amount = new RecommendUndelegation();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

const getDelegateTransactionStatus = async (
  a: Account,
  t: Transaction,
  isPreValidation = false
): Promise<TransactionStatus> => {
  const errors: StatusErrorMap = {};
  const warnings: StatusErrorMap = {};
  if (
    t.validators.some(
      (v) => !v.address || !v.address.includes("cosmosvaloper")
    ) ||
    t.validators.length === 0
  )
    errors.recipient = new InvalidAddress(undefined, {
      currencyName: a.currency.name,
    });

  if (t.validators.length > COSMOS_MAX_DELEGATIONS) {
    errors.validators = new CosmosTooManyValidators();
  }

  let amount = t.validators.reduce(
    (old, current) => old.plus(current.amount),
    new BigNumber(0)
  );

  if (amount.eq(0)) {
    errors.amount = new AmountRequired();
  }

  const estimatedFees = t.fees || new BigNumber(0);

  if (!isPreValidation && !t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  let totalSpent = amount.plus(estimatedFees);

  if (totalSpent.eq(a.spendableBalance)) {
    warnings.delegate = new CosmosDelegateAllFundsWarning();
  }

  if (
    !errors.recipient &&
    !errors.amount &&
    (amount.lt(0) || totalSpent.gt(a.spendableBalance))
  ) {
    errors.amount = new NotEnoughBalance();
    amount = new BigNumber(0);
    totalSpent = new BigNumber(0);
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

const getTransactionStatus = async (
  a: Account,
  t: Transaction,
  isPreValidation = false
): Promise<TransactionStatus> => {
  if (t.mode === "send") {
    // We isolate the send transaction that it's a little bit different from the rest
    return await getSendTransactionStatus(a, t, isPreValidation);
  } else if (t.mode === "delegate") {
    return await getDelegateTransactionStatus(a, t, isPreValidation);
  }

  const errors: StatusErrorMap = {};
  const warnings: StatusErrorMap = {};
  // here we only treat about all other mode than delegate and send
  if (
    t.validators.some(
      (v) => !v.address || !v.address.includes("cosmosvaloper")
    ) ||
    t.validators.length === 0
  )
    errors.recipient = new InvalidAddress(undefined, {
      currencyName: a.currency.name,
    });

  if (t.mode === "redelegate") {
    const redelegationError = redelegationStatusError(a, t);

    if (redelegationError) {
      // Note : note sure if I have to put this error on this field
      errors.redelegation = redelegationError;
    }
  } else if (t.mode === "undelegate") {
    invariant(
      a.cosmosResources &&
        a.cosmosResources.unbondings.length < COSMOS_MAX_UNBONDINGS,
      "unbondings should not have more than 6 entries"
    );
    if (t.validators.length === 0)
      errors.recipient = new InvalidAddress(undefined, {
        currencyName: a.currency.name,
      });
    const [first] = t.validators;
    const unbondingError = first && isDelegable(a, first.address, first.amount);

    if (unbondingError) {
      errors.unbonding = unbondingError;
    }
  }

  const validatorAmount = t.validators.reduce(
    (old, current) => old.plus(current.amount),
    new BigNumber(0)
  );

  if (t.mode !== "claimReward" && validatorAmount.lte(0)) {
    errors.amount = new AmountRequired();
  }

  const estimatedFees = t.fees || new BigNumber(0);

  if (!isPreValidation && !t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  let totalSpent = estimatedFees;

  if (["claimReward", "claimRewardCompound"].includes(t.mode)) {
    const { cosmosResources } = a;
    invariant(cosmosResources, "cosmosResources should exist");
    const claimReward =
      t.validators.length && cosmosResources
        ? cosmosResources.delegations.find(
            (delegation) =>
              delegation.validatorAddress === t.validators[0].address
          )
        : null;

    if (claimReward && estimatedFees.gt(claimReward.pendingRewards)) {
      warnings.claimReward = new ClaimRewardsFeesWarning();
    }
  }

  if (
    !errors.recipient &&
    !errors.amount &&
    (validatorAmount.lt(0) || totalSpent.gt(a.spendableBalance))
  ) {
    errors.amount = new NotEnoughBalance();
    totalSpent = new BigNumber(0);
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount: new BigNumber(0),
    totalSpent,
  });
};

export default getTransactionStatus;
