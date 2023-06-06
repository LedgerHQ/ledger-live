import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import { formatCurrencyUnit, getCryptoCurrencyById } from "../../currencies";
import type {
  Transaction,
  StatusErrorMap,
  NearAccount,
  TransactionStatus,
} from "./types";
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

const getTransactionStatus = async (
  a: NearAccount,
  t: Transaction
): Promise<TransactionStatus> => {
  if (t.mode === "send") {
    return await getSendTransactionStatus(a, t);
  }

  const errors: StatusErrorMap = {};
  const warnings: StatusErrorMap = {};
  const useAllAmount = !!t.useAllAmount;

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = t.fees || new BigNumber(0);

  const maxAmount = getMaxAmount(a, t, estimatedFees);
  const maxAmountWithFees = getMaxAmount(a, t);
  const spendableBalanceWithFees = getMaxAmount(a, { ...t, mode: "stake" });
  const stakingThreshold = getYoctoThreshold();

  const totalSpent = getTotalSpent(a, t, estimatedFees);
  const amount = useAllAmount ? maxAmount : new BigNumber(t.amount);

  const isStakeAndNotEnoughBalance =
    t.mode === "stake" &&
    (totalSpent.gt(maxAmountWithFees) || maxAmountWithFees.lt(estimatedFees));
  const isUnstakeOrWithdrawAndNotEnoughBalance =
    ["unstake", "withdraw"].includes(t.mode) &&
    (totalSpent.gt(spendableBalanceWithFees) ||
      spendableBalanceWithFees.lt(estimatedFees));

  if (isStakeAndNotEnoughBalance || isUnstakeOrWithdrawAndNotEnoughBalance) {
    errors.amount = new NotEnoughBalance();
  } else if (
    ["stake", "unstake", "withdraw"].includes(t.mode) &&
    amount.lt(stakingThreshold)
  ) {
    const currency = getCryptoCurrencyById("near");
    const formattedStakingThreshold = formatCurrencyUnit(
      currency.units[0],
      stakingThreshold.plus(YOCTO_THRESHOLD_VARIATION),
      {
        showCode: true,
      }
    );
    errors.amount = new NearStakingThresholdNotMet(undefined, {
      threshold: formattedStakingThreshold,
    });
  } else if (t.mode === "unstake" && amount.gt(maxAmount)) {
    errors.amount = new NearNotEnoughStaked();
  } else if (t.mode === "withdraw" && amount.gt(maxAmount)) {
    errors.amount = new NearNotEnoughAvailable();
  } else if (amount.lte(0) && !t.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  if (t.mode === "stake" && !errors.amount && t.useAllAmount) {
    warnings.amount = new NearUseAllAmountStakeWarning();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

const getSendTransactionStatus = async (
  a: NearAccount,
  t: Transaction
): Promise<TransactionStatus> => {
  const errors: StatusErrorMap = {};
  const warnings: StatusErrorMap = {};
  const useAllAmount = !!t.useAllAmount;

  const { storageCost } = getCurrentNearPreloadData();

  const newAccountStorageCost = storageCost.multipliedBy(NEW_ACCOUNT_SIZE);
  const currency = getCryptoCurrencyById("near");
  const formattedNewAccountStorageCost = formatCurrencyUnit(
    currency.units[0],
    newAccountStorageCost,
    {
      showCode: true,
    }
  );

  let recipientIsNewAccount;
  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidAddress(t.recipient)) {
    errors.recipient = new InvalidAddress();
  } else {
    const accountDetails = await fetchAccountDetails(t.recipient);

    if (!accountDetails) {
      recipientIsNewAccount = true;

      if (isImplicitAccount(t.recipient)) {
        warnings.recipient = new NearNewAccountWarning(undefined, {
          formattedNewAccountStorageCost,
        });
      } else {
        errors.recipient = new NearNewNamedAccountError();
      }
    }
  }

  if (a.freshAddress === t.recipient) {
    warnings.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = t.fees || new BigNumber(0);

  const totalSpent = getTotalSpent(a, t, estimatedFees);
  const maxAmount = getMaxAmount(a, t, estimatedFees);
  const maxAmountWithFees = getMaxAmount(a, t);

  const amount = useAllAmount ? maxAmount : new BigNumber(t.amount);

  if (totalSpent.gt(maxAmountWithFees) || maxAmountWithFees.lt(estimatedFees)) {
    errors.amount = new NotEnoughBalance();
  } else if (amount.lte(0) && !t.useAllAmount) {
    errors.amount = new AmountRequired();
  } else if (recipientIsNewAccount && amount.lt(newAccountStorageCost)) {
    errors.amount = new NearActivationFeeNotCovered(undefined, {
      formattedNewAccountStorageCost,
    });
  }

  if (
    a.nearResources?.stakingPositions &&
    a.nearResources.stakingPositions.length > 0 &&
    useAllAmount
  ) {
    warnings.amount = new NearRecommendUnstake();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

export default getTransactionStatus;
