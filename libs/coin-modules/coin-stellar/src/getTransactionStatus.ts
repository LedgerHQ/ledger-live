import {
  AccountAwaitingSendPendingOperations,
  AmountRequired,
  NotEnoughBalance,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughSpendableBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  RecipientRequired,
  InvalidAddress,
} from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { isAddressValid, isAccountMultiSign, isMemoValid, getRecipientAccount } from "./logic";
import { BASE_RESERVE, MIN_BALANCE } from "./network";
import type { Transaction } from "./types";
import {
  StellarWrongMemoFormat,
  StellarAssetRequired,
  StellarAssetNotAccepted,
  StellarAssetNotFound,
  StellarNotEnoughNativeBalance,
  StellarFeeSmallerThanRecommended,
  StellarFeeSmallerThanBase,
  StellarNotEnoughNativeBalanceToAddTrustline,
  StellarMuxedAccountNotExist,
  StellarSourceHasMultiSign,
} from "./errors";

export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] = async (
  account,
  transaction,
) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const useAllAmount = !!transaction.useAllAmount;

  const destinationNotExistMessage = new NotEnoughBalanceBecauseDestinationNotCreated("", {
    minimalAmount: `${MIN_BALANCE} XLM`,
  });

  if (account.pendingOperations.length > 0) {
    throw new AccountAwaitingSendPendingOperations();
  }

  if (!transaction.fees || !transaction.baseReserve) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = !transaction.fees ? new BigNumber(0) : transaction.fees;
  const baseReserve = !transaction.baseReserve ? new BigNumber(0) : transaction.baseReserve;
  const isAssetPayment =
    transaction.subAccountId && transaction.assetCode && transaction.assetIssuer;
  const nativeBalance = account.balance;
  const nativeAmountAvailable = account.spendableBalance.minus(estimatedFees);

  let amount = new BigNumber(0);
  let maxAmount = new BigNumber(0);
  let totalSpent = new BigNumber(0);

  // Enough native balance to cover transaction (with required reserve + fees)
  if (!errors.amount && nativeAmountAvailable.lt(0)) {
    errors.amount = new StellarNotEnoughNativeBalance();
  }

  // Entered fee is smaller than base fee
  if (estimatedFees.lt(transaction.networkInfo?.baseFee || 0)) {
    errors.transaction = new StellarFeeSmallerThanBase();
    // Entered fee is smaller than recommended
  } else if (estimatedFees.lt(transaction.networkInfo?.fees || 0)) {
    warnings.transaction = new StellarFeeSmallerThanRecommended();
  }

  // Operation specific checks
  if (transaction.mode === "changeTrust") {
    // Check asset provided
    if (!transaction.assetCode || !transaction.assetIssuer) {
      // This is unlikely
      errors.transaction = new StellarAssetRequired("");
    }

    // Has enough native balance to add new trustline
    if (nativeAmountAvailable.minus(BASE_RESERVE).lt(0)) {
      errors.amount = new StellarNotEnoughNativeBalanceToAddTrustline();
    }
  } else {
    // Payment
    // Check recipient address
    if (!transaction.recipient) {
      errors.recipient = new RecipientRequired("");
    } else if (!isAddressValid(transaction.recipient)) {
      errors.recipient = new InvalidAddress("", {
        currencyName: account.currency.name,
      });
    } else if (account.freshAddress === transaction.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    }

    const recipientAccount = await getRecipientAccount({
      account: account,
      recipient: transaction.recipient,
    });

    // Check recipient account
    if (!recipientAccount?.id && !errors.recipient && !warnings.recipient) {
      if (recipientAccount?.isMuxedAccount) {
        errors.recipient = new StellarMuxedAccountNotExist();
      } else {
        if (isAssetPayment) {
          errors.recipient = destinationNotExistMessage;
        } else {
          warnings.recipient = destinationNotExistMessage;
        }
      }
    }

    // Asset payment
    if (isAssetPayment) {
      const asset = findSubAccountById(account, transaction.subAccountId || "");

      if (asset === null) {
        // This is unlikely
        throw new StellarAssetNotFound();
      }

      // Check recipient account accepts asset
      if (
        recipientAccount?.id &&
        !errors.recipient &&
        !warnings.recipient &&
        !recipientAccount.assetIds.includes(`${transaction.assetCode}:${transaction.assetIssuer}`)
      ) {
        errors.recipient = new StellarAssetNotAccepted("", {
          assetCode: transaction.assetCode,
        });
      }

      const assetBalance = asset?.balance || new BigNumber(0);

      maxAmount = asset?.spendableBalance || assetBalance;
      amount = useAllAmount ? maxAmount : transaction.amount;
      totalSpent = amount;

      if (!errors.amount && amount.gt(assetBalance)) {
        errors.amount = new NotEnoughBalance();
      }
    } else {
      // Native payment
      maxAmount = nativeAmountAvailable;
      amount = useAllAmount ? maxAmount : transaction.amount || 0;

      if (amount.gt(maxAmount)) {
        errors.amount = new NotEnoughBalance();
      }

      totalSpent = useAllAmount ? nativeAmountAvailable : transaction.amount.plus(estimatedFees);

      // Need to send at least 1 XLM to create an account
      if (!errors.recipient && !recipientAccount?.id && !errors.amount && amount.lt(10000000)) {
        errors.amount = destinationNotExistMessage;
      }

      if (totalSpent.gt(nativeBalance.minus(baseReserve))) {
        errors.amount = new NotEnoughSpendableBalance(undefined, {
          minimumAmount: formatCurrencyUnit(account.currency.units[0], baseReserve, {
            disableRounding: true,
            showCode: true,
          }),
        });
      }

      if (!errors.recipient && !errors.amount && (amount.lt(0) || totalSpent.gt(nativeBalance))) {
        errors.amount = new NotEnoughBalance();
        totalSpent = new BigNumber(0);
        amount = new BigNumber(0);
      }
    }

    if (!errors.amount && amount.eq(0)) {
      errors.amount = new AmountRequired();
    }
  }

  if (await isAccountMultiSign(account)) {
    errors.recipient = new StellarSourceHasMultiSign();
  }

  if (
    transaction.memoType &&
    transaction.memoValue &&
    !isMemoValid(transaction.memoType, transaction.memoValue)
  ) {
    errors.transaction = new StellarWrongMemoFormat();
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
