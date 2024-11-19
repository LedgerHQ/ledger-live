import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { Transaction, StatusErrorMap, NearAccount, TransactionStatus } from "./types";
import {
  isValidAddress,
  isImplicitAccount,
  getMaxAmount,
  getTotalSpent,
  getYoctoThreshold,
} from "./logic";
import { fetchAccountDetails } from "./api";
import { getCurrentNearPreloadData } from "./preload";
import {
  NearNewAccountWarning,
  NearActivationFeeNotCovered,
  NearNewNamedAccountError,
  NearUseAllAmountStakeWarning,
  NearNotEnoughStaked,
  NearNotEnoughAvailable,
  NearRecommendUnstake,
  NearStakingThresholdNotMet,
} from "./errors";
import { NEW_ACCOUNT_SIZE, YOCTO_THRESHOLD_VARIATION } from "./constants";

export const getTransactionStatus: AccountBridge<
  Transaction,
  NearAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  if (transaction.mode === "send") {
    return await getSendTransactionStatus(account, transaction);
  }

  const errors: StatusErrorMap = {};
  const warnings: StatusErrorMap = {};
  const useAllAmount = !!transaction.useAllAmount;

  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = transaction.fees || new BigNumber(0);

  const maxAmount = getMaxAmount(account, transaction, estimatedFees);
  const maxAmountWithFees = getMaxAmount(account, transaction);
  const spendableBalanceWithFees = getMaxAmount(account, { ...transaction, mode: "stake" });
  const stakingThreshold = getYoctoThreshold();

  const totalSpent = getTotalSpent(account, transaction, estimatedFees);
  const amount = useAllAmount ? maxAmount : new BigNumber(transaction.amount);

  const isStakeAndNotEnoughBalance =
    transaction.mode === "stake" &&
    (totalSpent.gt(maxAmountWithFees) || maxAmountWithFees.lt(estimatedFees));
  const isUnstakeOrWithdrawAndNotEnoughBalance =
    ["unstake", "withdraw"].includes(transaction.mode) &&
    (totalSpent.gt(spendableBalanceWithFees) || spendableBalanceWithFees.lt(estimatedFees));

  if (isStakeAndNotEnoughBalance || isUnstakeOrWithdrawAndNotEnoughBalance) {
    errors.amount = new NotEnoughBalance();
  } else if (
    ["stake", "unstake", "withdraw"].includes(transaction.mode) &&
    amount.lt(stakingThreshold)
  ) {
    const currency = getCryptoCurrencyById("near");
    const formattedStakingThreshold = formatCurrencyUnit(
      currency.units[0],
      stakingThreshold.plus(YOCTO_THRESHOLD_VARIATION),
      {
        showCode: true,
      },
    );
    errors.amount = new NearStakingThresholdNotMet(undefined, {
      threshold: formattedStakingThreshold,
    });
  } else if (transaction.mode === "unstake" && amount.gt(maxAmount)) {
    errors.amount = new NearNotEnoughStaked();
  } else if (transaction.mode === "withdraw" && amount.gt(maxAmount)) {
    errors.amount = new NearNotEnoughAvailable();
  } else if (amount.lte(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  if (transaction.mode === "stake" && !errors.amount && transaction.useAllAmount) {
    warnings.amount = new NearUseAllAmountStakeWarning();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

const getSendTransactionStatus = async (
  account: NearAccount,
  transaction: Transaction,
): Promise<TransactionStatus> => {
  const errors: StatusErrorMap = {};
  const warnings: StatusErrorMap = {};
  const useAllAmount = !!transaction.useAllAmount;

  const { storageCost } = getCurrentNearPreloadData();

  const newAccountStorageCost = storageCost.multipliedBy(NEW_ACCOUNT_SIZE);
  const currency = getCryptoCurrencyById("near");
  const formattedNewAccountStorageCost = formatCurrencyUnit(
    currency.units[0],
    newAccountStorageCost,
    {
      showCode: true,
    },
  );

  let recipientIsNewAccount;
  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidAddress(transaction.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  } else {
    const accountDetails = await fetchAccountDetails(transaction.recipient);

    if (!accountDetails) {
      recipientIsNewAccount = true;

      if (isImplicitAccount(transaction.recipient)) {
        warnings.recipient = new NearNewAccountWarning(undefined, {
          formattedNewAccountStorageCost,
        });
      } else {
        errors.recipient = new NearNewNamedAccountError();
      }
    }
  }

  if (account.freshAddress === transaction.recipient) {
    warnings.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = transaction.fees || new BigNumber(0);

  const totalSpent = getTotalSpent(account, transaction, estimatedFees);
  const maxAmount = getMaxAmount(account, transaction, estimatedFees);
  const maxAmountWithFees = getMaxAmount(account, transaction);

  const amount = useAllAmount ? maxAmount : new BigNumber(transaction.amount);

  if (totalSpent.gt(maxAmountWithFees) || maxAmountWithFees.lt(estimatedFees)) {
    errors.amount = new NotEnoughBalance();
  } else if (amount.lte(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  } else if (recipientIsNewAccount && amount.lt(newAccountStorageCost)) {
    errors.amount = new NearActivationFeeNotCovered(undefined, {
      formattedNewAccountStorageCost,
    });
  }

  if (account.nearResources?.stakingPositions.length > 0 && useAllAmount) {
    warnings.amount = new NearRecommendUnstake();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

export default getTransactionStatus;
