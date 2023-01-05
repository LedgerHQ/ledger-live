import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
  RecommendUndelegation,
} from "@ledgerhq/errors";
import {
  ClaimRewardsFeesWarning,
  CosmosDelegateAllFundsWarning,
  CosmosRedelegationInProgress,
  CosmosTooManyValidators,
  NotEnoughDelegationBalance,
} from "../../errors";
import {
  CosmosLikeTransaction,
  StatusErrorMap,
  CosmosAccount,
  TransactionStatus,
} from "./types";
import { BigNumber } from "bignumber.js";
import {
  COSMOS_MAX_DELEGATIONS,
  COSMOS_MAX_REDELEGATIONS,
  COSMOS_MAX_UNBONDINGS,
  getMaxEstimatedBalance,
} from "./logic";
import invariant from "invariant";
import * as bech32 from "bech32";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import cryptoFactory from "./chain/chain";

export class CosmosTransactionStatusManager {
  getTransactionStatus = async (
    a: CosmosAccount,
    t: CosmosLikeTransaction
  ): Promise<TransactionStatus> => {
    if (t.mode === "send") {
      // We isolate the send transaction that it's a little bit different from the rest
      return await this.getSendTransactionStatus(a, t);
    } else if (t.mode === "delegate") {
      return await this.getDelegateTransactionStatus(a, t);
    }

    const errors: StatusErrorMap = {};
    const warnings: StatusErrorMap = {};
    // here we only treat about all other mode than delegate and send
    if (
      t.validators.some(
        (v) =>
          !v.address ||
          !v.address.includes(
            cryptoFactory(a.currency.id).validatorOperatorAddressPrefix
          )
      ) ||
      t.validators.length === 0
    )
      errors.recipient = new InvalidAddress(undefined, {
        currencyName: a.currency.name,
      });

    if (t.mode === "redelegate") {
      const redelegationError = this.redelegationStatusError(a, t);

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
      const unbondingError =
        first && this.isDelegable(a, first.address, first.amount);

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

    if (!t.fees) {
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

  private getDelegateTransactionStatus = async (
    a: CosmosAccount,
    t: CosmosLikeTransaction
  ): Promise<TransactionStatus> => {
    const errors: StatusErrorMap = {};
    const warnings: StatusErrorMap = {};
    if (
      t.validators.some(
        (v) =>
          !v.address ||
          !v.address.includes(
            cryptoFactory(a.currency.id).validatorOperatorAddressPrefix
          )
      ) ||
      t.validators.length === 0
    )
      errors.recipient = new InvalidAddress(undefined, {
        currencyName: a.currency.name,
      });

    if (t.validators.length > COSMOS_MAX_DELEGATIONS) {
      errors.validators = new CosmosTooManyValidators();
    }

    const estimatedFees = t.fees || new BigNumber(0);

    if (!t.fees || !t.fees.gt(0)) {
      errors.fees = new FeeNotLoaded();
    }
    const amount = t.useAllAmount
      ? getMaxEstimatedBalance(a, estimatedFees)
      : t.amount;
    const totalSpent = amount.plus(estimatedFees);

    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    }

    if (
      !errors.recipient &&
      !errors.amount &&
      (amount.lt(0) || totalSpent.gt(a.spendableBalance))
    ) {
      errors.amount = new NotEnoughBalance();
    }

    if (!errors.amount && t.useAllAmount) {
      warnings.amount = new CosmosDelegateAllFundsWarning();
    }

    return Promise.resolve({
      errors,
      warnings,
      estimatedFees,
      amount,
      totalSpent,
    });
  };

  private getSendTransactionStatus = async (
    a: CosmosAccount,
    t: CosmosLikeTransaction
  ): Promise<TransactionStatus> => {
    const errors: StatusErrorMap = {};
    const warnings: StatusErrorMap = {};

    if (!t.recipient) {
      errors.recipient = new RecipientRequired("");
    } else if (a.freshAddress === t.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    } else {
      let isValid = true;
      try {
        bech32.decode(t.recipient);
      } catch (e) {
        isValid = false;
      }
      isValid =
        isValid &&
        t.recipient.startsWith(
          findCryptoCurrencyById(a.currency.name.toLowerCase())?.id ?? ""
        );
      if (!isValid) {
        errors.recipient = new InvalidAddress(undefined, {
          currencyName: a.currency.name,
        });
      }
    }

    let amount = t.amount;

    if (amount.lte(0) && !t.useAllAmount) {
      errors.amount = new AmountRequired();
    }

    const estimatedFees = t.fees || new BigNumber(0);
    if (!t.fees || !t.fees.gt(0)) {
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

  private redelegationStatusError = (
    a: CosmosAccount,
    t: CosmosLikeTransaction
  ) => {
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
            dstValidator === t.sourceValidator &&
            redelegation.completionDate > new Date()
          );
        })
      ) {
        return new CosmosRedelegationInProgress();
      }

      if (t.validators.length > 0) {
        if (t.sourceValidator === t.validators[0].address) {
          return new InvalidAddressBecauseDestinationIsAlsoSource();
        } else {
          return this.isDelegable(a, t.sourceValidator, t.validators[0].amount);
        }
      }
    }

    return null;
  };

  private isDelegable = (
    a: CosmosAccount,
    address: string | undefined | null,
    amount: BigNumber
  ) => {
    const { cosmosResources } = a;
    invariant(cosmosResources, "cosmosResources should exist");

    if (
      cosmosResources &&
      cosmosResources.delegations.some(
        (delegation) =>
          delegation.validatorAddress === address &&
          delegation.amount.lt(amount)
      )
    ) {
      return new NotEnoughDelegationBalance();
    }

    return null;
  };
}

const cosmosTransactionStatusManager = new CosmosTransactionStatusManager();

export default cosmosTransactionStatusManager.getTransactionStatus;
