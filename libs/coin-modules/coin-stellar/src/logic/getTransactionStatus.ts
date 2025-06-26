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
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { Transaction, TransactionValidation, Account } from "@ledgerhq/coin-framework/api/types";
import { isAddressValid, isAccountMultiSign, isMemoValid } from "./utils";
import { BASE_RESERVE, MIN_BALANCE, getRecipientAccount } from "../network";
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
  // type Transaction,
} from "../types";
import BigNumber from "bignumber.js";
import { findSubAccountById } from "@ledgerhq/coin-framework/lib/account/helpers";

// export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] = async (
//   account,
//   transaction,
// ) => {

export const getTransactionStatus = async (
  account: Account,
  transaction: Transaction,
): Promise<TransactionValidation> => {
  const asset = account; // FIXME:
  console.log("getTransactionStatus account", account);
  console.log("getTransactionStatus transaction", transaction);
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const useAllAmount = !!transaction.useAllAmount;

  const destinationNotExistMessage = new NotEnoughBalanceBecauseDestinationNotCreated("", {
    minimalAmount: `${MIN_BALANCE} XLM`,
  });

  if (account.pendingOperations > 0) {
    throw new AccountAwaitingSendPendingOperations();
  }

  // if (!transaction.fee || !transaction.baseReserve) {
  //   errors.fees = new FeeNotLoaded();
  // }

  const estimatedFees = !transaction.fee ? 0n : transaction.fee;
  const baseReserve = !transaction.baseReserve ? 0n : transaction.baseReserve;
  const isAssetPayment =
    transaction.subAccountId && transaction.assetCode && transaction.assetIssuer;
  const nativeBalance = account.balance;
  const nativeAmountAvailable = account.spendableBalance - estimatedFees;

  let amount = 0n;
  let maxAmount = 0n;
  let totalSpent = 0n;

  // Enough native balance to cover transaction (with required reserve + fees)
  if (!errors.amount && nativeAmountAvailable < 0) {
    errors.amount = new StellarNotEnoughNativeBalance();
  }

  // Entered fee is smaller than base fee
  if (estimatedFees < (transaction.networkInfo?.baseFee || 0n)) {
    errors.transaction = new StellarFeeSmallerThanBase();
    // Entered fee is smaller than recommended
  } else if (estimatedFees < (transaction.networkInfo?.fees || 0n)) {
    warnings.transaction = new StellarFeeSmallerThanRecommended();
  }

  /*
  * amount: 0n
    fee: 100n
    recipient: ""
    type: "PAYMENT"
    useAllAmount: false
    */
  debugger;
  // Operation specific checks
  if (transaction.type === "changeTrust") {
    // Check asset provided
    if (!transaction.assetCode || !transaction.assetIssuer) {
      // This is unlikely
      errors.transaction = new StellarAssetRequired("");
    }

    // Has enough native balance to add new trustline
    // NOTE: need to do this as BASE_RESERVE is 0.5
    const SCALE = 10n;
    const scaledNative = nativeAmountAvailable * SCALE;
    const scaledBaseReserve = BigInt(BASE_RESERVE * 10); // = 5n

    if (scaledNative - scaledBaseReserve < 0n) {
      errors.amount = new StellarNotEnoughNativeBalanceToAddTrustline();
    }
  } else {
    // Payment
    // Check recipient address
    if (!transaction.recipient) {
      errors.recipient = new RecipientRequired("");
    } else if (!isAddressValid(transaction.recipient)) {
      errors.recipient = new InvalidAddress("", {
        currencyName: account.currencyName,
      });
    } else if (account.address === transaction.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    }

    const recipientAccount = await getRecipientAccount({
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
      // NOTE: previously, fetched with coin-framework's findSubAccountById, move logic in generic-bridge
      // const asset = findSubAccountById(account, transaction.subAccountId || "");

      if (!asset === null) {
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

      const assetBalance = asset?.balance || 0n;

      maxAmount = asset?.spendableBalance || assetBalance;
      amount = useAllAmount ? maxAmount : transaction.amount;
      totalSpent = amount;

      if (!errors.amount && amount > assetBalance) {
        errors.amount = new NotEnoughBalance();
      }
    } else {
      // Native payment
      maxAmount = nativeAmountAvailable;
      amount = useAllAmount ? maxAmount : transaction.amount ?? 0n;

      if (amount > maxAmount) {
        errors.amount = new NotEnoughBalance();
      }

      totalSpent = useAllAmount ? nativeAmountAvailable : transaction.amount + estimatedFees;

      // Need to send at least 1 XLM to create an account
      if (!errors.recipient && !recipientAccount?.id && !errors.amount && amount < 10000000n) {
        errors.amount = destinationNotExistMessage;
      }

      if (totalSpent > nativeBalance - baseReserve) {
        errors.amount = new NotEnoughSpendableBalance(undefined, {
          minimumAmount: formatCurrencyUnit(
            account.currencyUnit,
            new BigNumber(baseReserve.toString()),
            {
              disableRounding: true,
              showCode: true,
            },
          ),
        });
      }

      if (!errors.recipient && !errors.amount && (amount < 0n || totalSpent > nativeBalance)) {
        errors.amount = new NotEnoughBalance();
        totalSpent = 0n;
        amount = 0n;
      }
    }

    if (!errors.amount && amount === 0n) {
      errors.amount = new AmountRequired();
    }
  }

  if (await isAccountMultiSign(account.address)) {
    errors.recipient = new StellarSourceHasMultiSign();
  }

  if (
    typeof transaction.memoType === "string" &&
    typeof transaction.memoValue === "string" &&
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
