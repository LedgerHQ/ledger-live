import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  NotEnoughBalance,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughSpendableBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  RecipientRequired,
  InvalidAddress,
} from "@ledgerhq/errors";
import {
  StellarWrongMemoFormat,
  AccountAwaitingSendPendingOperations,
  StellarAssetRequired,
  StellarAssetNotAccepted,
  StellarAssetNotFound,
  StellarNotEnoughNativeBalance,
  StellarFeeSmallerThanRecommended,
  StellarFeeSmallerThanBase,
  StellarNotEnoughNativeBalanceToAddTrustline,
  StellarMuxedAccountNotExist,
  StellarSourceHasMultiSign,
} from "../../errors";
import { findSubAccountById } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { isAddressValid, isAccountMultiSign, isMemoValid, getRecipientAccount } from "./logic";
import { BASE_RESERVE, MIN_BALANCE } from "./api";

const getTransactionStatus = async (
  a: Account,
  t: Transaction,
): Promise<{
  errors: Record<string, Error>;
  warnings: Record<string, Error>;
  estimatedFees: BigNumber;
  amount: BigNumber;
  totalSpent: BigNumber;
}> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const useAllAmount = !!t.useAllAmount;

  const destinationNotExistMessage = new NotEnoughBalanceBecauseDestinationNotCreated("", {
    minimalAmount: `${MIN_BALANCE} XLM`,
  });

  if (a.pendingOperations.length > 0) {
    throw new AccountAwaitingSendPendingOperations();
  }

  if (!t.fees || !t.baseReserve) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = !t.fees ? new BigNumber(0) : t.fees;
  const baseReserve = !t.baseReserve ? new BigNumber(0) : t.baseReserve;
  const isAssetPayment = t.subAccountId && t.assetCode && t.assetIssuer;
  const nativeBalance = a.balance;
  const nativeAmountAvailable = a.spendableBalance.minus(estimatedFees);

  let amount = new BigNumber(0);
  let maxAmount = new BigNumber(0);
  let totalSpent = new BigNumber(0);

  // Enough native balance to cover transaction (with required reserve + fees)
  if (!errors.amount && nativeAmountAvailable.lt(0)) {
    errors.amount = new StellarNotEnoughNativeBalance();
  }

  // Entered fee is smaller than base fee
  if (estimatedFees.lt(t.networkInfo?.baseFee || 0)) {
    errors.transaction = new StellarFeeSmallerThanBase();
    // Entered fee is smaller than recommended
  } else if (estimatedFees.lt(t.networkInfo?.fees || 0)) {
    warnings.transaction = new StellarFeeSmallerThanRecommended();
  }

  // Operation specific checks
  if (t.mode === "changeTrust") {
    // Check asset provided
    if (!t.assetCode || !t.assetIssuer) {
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
    if (!t.recipient) {
      errors.recipient = new RecipientRequired("");
    } else if (!isAddressValid(t.recipient)) {
      errors.recipient = new InvalidAddress("");
    } else if (a.freshAddress === t.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    }

    const recipientAccount = await getRecipientAccount({
      account: a,
      recipient: t.recipient,
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
      const asset = findSubAccountById(a, t.subAccountId || "") as TokenAccount;

      if (asset === null) {
        // This is unlikely
        throw new StellarAssetNotFound();
      }

      // Check recipient account accepts asset
      if (
        recipientAccount?.id &&
        !errors.recipient &&
        !warnings.recipient &&
        !recipientAccount.assetIds.includes(`${t.assetCode}:${t.assetIssuer}`)
      ) {
        errors.recipient = new StellarAssetNotAccepted("", {
          assetCode: t.assetCode,
        });
      }

      const assetBalance = asset?.balance || new BigNumber(0);

      maxAmount = asset?.spendableBalance || assetBalance;
      amount = useAllAmount ? maxAmount : t.amount;
      totalSpent = amount;

      if (!errors.amount && amount.gt(assetBalance)) {
        errors.amount = new NotEnoughBalance();
      }
    } else {
      // Native payment
      maxAmount = nativeAmountAvailable;
      amount = useAllAmount ? maxAmount : t.amount || 0;

      if (amount.gt(maxAmount)) {
        errors.amount = new NotEnoughBalance();
      }

      totalSpent = useAllAmount ? nativeAmountAvailable : t.amount.plus(estimatedFees);

      // Need to send at least 1 XLM to create an account
      if (!errors.recipient && !recipientAccount?.id && !errors.amount && amount.lt(10000000)) {
        errors.amount = destinationNotExistMessage;
      }

      if (totalSpent.gt(nativeBalance.minus(baseReserve))) {
        errors.amount = new NotEnoughSpendableBalance(undefined, {
          minimumAmount: formatCurrencyUnit(a.currency.units[0], baseReserve, {
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

  if (await isAccountMultiSign(a)) {
    errors.recipient = new StellarSourceHasMultiSign();
  }

  if (t.memoType && t.memoValue && !isMemoValid(t.memoType, t.memoValue)) {
    errors.transaction = new StellarWrongMemoFormat();
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
