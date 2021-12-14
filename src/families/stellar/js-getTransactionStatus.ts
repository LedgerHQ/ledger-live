import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  NotEnoughBalance,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughSpendableBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  RecipientRequired,
} from "@ledgerhq/errors";
import {
  StellarWrongMemoFormat,
  SourceHasMultiSign,
  AccountAwaitingSendPendingOperations,
  StellarAssetRequired,
  StellarAssetNotAccepted,
  StellarAssetNotFound,
  StellarNotEnoughNativeBalance,
} from "../../errors";
import { findSubAccountById } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import type { Account } from "../../types";
import type { Transaction } from "./types";
import {
  isAddressValid,
  checkRecipientExist,
  isAccountMultiSign,
  isMemoValid,
  checkAcceptAsset,
} from "./logic";

const getTransactionStatus = async (
  a: Account,
  t: Transaction
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

  const destinationNotExistMessage =
    new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: "1 XLM",
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
  const nativeAmount = nativeBalance.minus(baseReserve).minus(estimatedFees);

  let amount = new BigNumber(0);
  let totalSpent = new BigNumber(0);

  // Check if can cover fees
  if (!errors.amount && nativeAmount.lt(0)) {
    errors.amount = new StellarNotEnoughNativeBalance();
  }

  // Operation specific checks
  if (t.operationType === "changeTrust") {
    // TODO: ??? both are set together, might be a better way to handle them
    // Check asset provided
    if (!t.assetCode) {
      errors.assetCode = new StellarAssetRequired("");
    }
    if (!t.assetIssuer) {
      errors.assetIssuer = new StellarAssetRequired("");
    }
  } else {
    // Payment
    // Asset payment
    if (isAssetPayment) {
      const asset = findSubAccountById(a, t.subAccountId || "");

      if (asset === null) {
        // This is unlikely
        throw new StellarAssetNotFound();
      }

      // Check recipient account accepts asset
      if (
        t.recipient &&
        !errors.recipient &&
        !warnings.recipient &&
        !(await checkAcceptAsset({
          recipient: t.recipient,
          assetCode: t.assetCode,
          assetIssuer: t.assetIssuer,
        }))
      ) {
        errors.recipient = new StellarAssetNotAccepted("");
      }

      const assetBalance = asset?.balance || new BigNumber(0);

      amount = useAllAmount ? assetBalance : t.amount;
      totalSpent = amount;

      if (!errors.amount && amount.gt(assetBalance)) {
        errors.amount = new NotEnoughBalance();
      }
    } else {
      // Native payment
      amount = useAllAmount ? nativeAmount : t.amount || 0;
      totalSpent = useAllAmount
        ? nativeBalance.plus(estimatedFees)
        : t.amount.plus(estimatedFees);

      // Need to send at least 1 XLM to create an account
      if (
        !errors.recipient &&
        t.recipient &&
        !errors.amount &&
        !(await checkRecipientExist({
          account: a,
          recipient: t.recipient,
        })) &&
        amount.lt(10000000)
      ) {
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

      if (
        !errors.recipient &&
        !errors.amount &&
        (amount.lt(0) || totalSpent.gt(nativeBalance))
      ) {
        errors.amount = new NotEnoughBalance();
        totalSpent = new BigNumber(0);
        amount = new BigNumber(0);
      }

      if (!errors.amount && amount.eq(0)) {
        errors.amount = new AmountRequired();
      }
    }

    // Check recipient address
    if (!t.recipient) {
      errors.recipient = new RecipientRequired("");
    } else if (a.freshAddress === t.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    } else if (!isAddressValid(t.recipient)) {
      errors.recipient = new InvalidAddress("");
    }

    // Check recipient account
    if (
      t.recipient &&
      !errors.recipient &&
      !warnings.recipient &&
      !(await checkRecipientExist({
        account: a,
        recipient: t.recipient,
      }))
    ) {
      if (isAssetPayment) {
        errors.recipient = destinationNotExistMessage;
      } else {
        warnings.recipient = destinationNotExistMessage;
      }
    }
  }

  if (await isAccountMultiSign(a)) {
    errors.recipient = new SourceHasMultiSign("", {
      currencyName: a.currency.name,
    });
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
