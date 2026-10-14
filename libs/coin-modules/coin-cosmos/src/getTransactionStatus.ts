import { findCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import {
  ClaimRewardsFeesWarning,
  CosmosDelegateAllFundsWarning,
  CosmosRedelegationInProgress,
  CosmosTooManyRedelegations,
  CosmosTooManyValidators,
  NotEnoughDelegationBalance,
  RecommendUndelegation,
} from "./errors";
import { AccountBridge } from "@ledgerhq/types-live";
import * as bech32 from "bech32";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { resolveSourceValidator, resolveTransactionValidators } from "./buildTransaction";
import cryptoFactory from "./chain/chain";
import {
  COSMOS_MAX_DELEGATIONS,
  COSMOS_MAX_REDELEGATIONS,
  COSMOS_MAX_UNBONDINGS,
  getMaxEstimatedBalance,
} from "./logic";
import {
  CosmosAccount,
  CosmosLikeTransaction,
  StatusErrorMap,
  Transaction,
  TransactionStatus,
} from "./types";

export class CosmosTransactionStatusManager {
  getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] = async (
    account: CosmosAccount,
    transaction: CosmosLikeTransaction,
  ) => {
    if (transaction.mode === "send") {
      // We isolate the send transaction that it's a little bit different from the rest
      return await this.getSendTransactionStatus(account, transaction);
    } else if (transaction.mode === "delegate") {
      return await this.getDelegateTransactionStatus(account, transaction);
    }

    const errors: StatusErrorMap = {};
    const warnings: StatusErrorMap = {};
    const validators = resolveTransactionValidators(transaction);
    // here we only treat about all other mode than delegate and send
    if (
      validators.some(
        v => !v.address || !v.address.includes(cryptoFactory(account.currency.id).validatorPrefix),
      ) ||
      validators.length === 0
    )
      errors.recipient = new InvalidAddress(undefined, {
        currencyName: account.currency.name,
      });

    if (transaction.mode === "redelegate") {
      const redelegationError = this.redelegationStatusError(account, transaction);

      if (redelegationError) {
        // Note : note sure if I have to put this error on this field
        errors.redelegation = redelegationError;
      }
    } else if (transaction.mode === "undelegate") {
      invariant(
        account.stakingResources.unbondings.length < COSMOS_MAX_UNBONDINGS,
        "unbondings should not have more than 6 entries",
      );
      if (validators.length === 0)
        errors.recipient = new InvalidAddress(undefined, {
          currencyName: account.currency.name,
        });
      const [first] = validators;
      const unbondingError = first && this.isDelegable(account, first.address, first.amount);

      if (unbondingError) {
        errors.unbonding = unbondingError;
      }
    }

    const validatorAmount = validators.reduce(
      (old, current) => old.plus(current.amount),
      new BigNumber(0),
    );

    if (transaction.mode !== "claimReward" && validatorAmount.lte(0)) {
      errors.amount = new AmountRequired();
    }

    const estimatedFees = transaction.fees || new BigNumber(0);

    if (!transaction.fees) {
      errors.fees = new FeeNotLoaded();
    }

    let totalSpent = estimatedFees;

    if (["claimReward", "claimRewardCompound", "compoundReward"].includes(transaction.mode)) {
      const claimReward = validators.length
        ? account.stakingResources.delegations.find(
            delegation => delegation.validatorAddress === validators[0].address,
          )
        : null;

      if (claimReward && estimatedFees.gt(claimReward.pendingRewards)) {
        warnings.claimReward = new ClaimRewardsFeesWarning();
      }
    }

    if (
      !errors.recipient &&
      !errors.amount &&
      (validatorAmount.lt(0) || totalSpent.gt(account.spendableBalance))
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
    account: CosmosAccount,
    transaction: CosmosLikeTransaction,
  ): Promise<TransactionStatus> => {
    const errors: StatusErrorMap = {};
    const warnings: StatusErrorMap = {};
    const validators = resolveTransactionValidators(transaction);
    if (
      validators.some(
        v => !v.address || !v.address.includes(cryptoFactory(account.currency.id).validatorPrefix),
      ) ||
      validators.length === 0
    )
      errors.recipient = new InvalidAddress(undefined, {
        currencyName: account.currency.name,
      });

    if (validators.length > COSMOS_MAX_DELEGATIONS) {
      errors.validators = new CosmosTooManyValidators();
    }

    const estimatedFees = transaction.fees || new BigNumber(0);

    // A zero fee is treated as missing here, unlike the send path below, which only raises on a
    // genuinely absent fee. A chain with `minGasPrice: 0` that enables staking therefore hits a
    // permanent FeeNotLoaded on this path: the Delegate button stays disabled with no message
    // explaining why. Left in place because no such chain currently reaches these modes; tracked
    // in LIVE-37264 alongside unit coverage for the staking paths.
    if (!transaction.fees || !transaction.fees.gt(0)) {
      errors.fees = new FeeNotLoaded();
    }
    const amount = transaction.useAllAmount
      ? getMaxEstimatedBalance(account, estimatedFees)
      : transaction.amount;
    const totalSpent = amount.plus(estimatedFees);

    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    }

    if (
      !errors.recipient &&
      !errors.amount &&
      (amount.lt(0) || totalSpent.gt(account.spendableBalance))
    ) {
      errors.amount = new NotEnoughBalance();
    }

    if (!errors.amount && transaction.useAllAmount) {
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
    account: CosmosAccount,
    transaction: CosmosLikeTransaction,
  ): Promise<TransactionStatus> => {
    const errors: StatusErrorMap = {};
    const warnings: StatusErrorMap = {};

    if (!transaction.recipient) {
      errors.recipient = new RecipientRequired("");
    } else if (account.freshAddress === transaction.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    } else {
      let isValid = true;
      try {
        bech32.decode(transaction.recipient);
      } catch {
        isValid = false;
      }
      const currency = findCryptoCurrencyById(account.currency.name.toLowerCase());
      let prefix = "";
      if (currency) {
        prefix = cryptoFactory(currency.id as string).prefix;
      }
      isValid = isValid && transaction.recipient.startsWith(prefix);
      if (!isValid) {
        errors.recipient = new InvalidAddress(undefined, {
          currencyName: account.currency.name,
        });
      }
    }

    let amount = transaction.amount;

    if (amount.lte(0) && !transaction.useAllAmount) {
      errors.amount = new AmountRequired();
    }

    const estimatedFees = transaction.fees || new BigNumber(0);
    // A zero fee is a loaded fee. `createTransaction` initialises `fees: null`, which is the
    // only genuine "not yet computed" state.
    if (!transaction.fees) {
      errors.fees = new FeeNotLoaded();
    }

    amount = transaction.useAllAmount ? getMaxEstimatedBalance(account, estimatedFees) : amount;
    const totalSpent = amount.plus(estimatedFees);

    if (
      (amount.lte(0) && transaction.useAllAmount) || // if use all Amount sets an amount at 0
      (!errors.recipient && !errors.amount && totalSpent.gt(account.spendableBalance)) // if spendable balance lower than total
    ) {
      errors.amount = new NotEnoughBalance();
    }

    if (account.stakingResources.delegations.length > 0 && transaction.useAllAmount) {
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
    account: CosmosAccount,
    transaction: CosmosLikeTransaction,
  ) => {
    const { redelegations } = account.stakingResources;
    const sourceValidator = resolveSourceValidator(transaction);
    const validators = resolveTransactionValidators(transaction);
    if (redelegations.length >= COSMOS_MAX_REDELEGATIONS) {
      return new CosmosTooManyRedelegations();
    }

    if (
      redelegations.some(redelegation => {
        const dstValidator = redelegation.validatorDstAddress;
        return dstValidator === sourceValidator && redelegation.completionDate > new Date();
      })
    ) {
      return new CosmosRedelegationInProgress();
    }

    if (validators.length > 0) {
      if (sourceValidator === validators[0].address) {
        return new InvalidAddressBecauseDestinationIsAlsoSource();
      } else {
        return this.isDelegable(account, sourceValidator, validators[0].amount);
      }
    }

    return null;
  };

  private isDelegable = (
    account: CosmosAccount,
    address: string | undefined | null,
    amount: BigNumber,
  ) => {
    if (
      account.stakingResources.delegations.some(
        delegation => delegation.validatorAddress === address && delegation.amount.lt(amount),
      )
    ) {
      return new NotEnoughDelegationBalance();
    }

    return null;
  };
}

const cosmosTransactionStatusManager = new CosmosTransactionStatusManager();

export default cosmosTransactionStatusManager.getTransactionStatus;
