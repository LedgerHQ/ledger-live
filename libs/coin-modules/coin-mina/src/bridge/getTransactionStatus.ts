import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { isValidAddress, getMaxAmount, getTotalSpent } from "../common-logic";
import { validateMemo } from "../logic/validateMemo";
import type { Transaction, MinaAccount, TransactionStatus, StatusErrorMap } from "../types/common";
import { AccountCreationFeeWarning, InvalidMemoMina, AmountTooSmall } from "./errors";

function validateRecipient(
  transaction: Transaction,
  account: MinaAccount,
  errors: StatusErrorMap,
): void {
  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired();
    return;
  }

  if (!isValidAddress(transaction.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
    return;
  }

  if (transaction.recipient === account.freshAddress) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }
}

function validateAccountCreationFee(
  transaction: Transaction,
  account: MinaAccount,
  errors: StatusErrorMap,
  warnings: StatusErrorMap,
): void {
  if (!transaction.fees?.accountCreationFee.gt(0)) return;

  const fee = formatCurrencyUnit(account.currency.units[0], transaction.fees.accountCreationFee, {
    showCode: true,
    disableRounding: true,
  });
  warnings.recipient = new AccountCreationFeeWarning(undefined, { fee });

  const isAmountTooSmall =
    transaction.amount.lt(transaction.fees.accountCreationFee) && transaction.amount.gt(0);
  if (isAmountTooSmall) {
    errors.amount = new AmountTooSmall(undefined, { amount: fee });
  }
}

const getTransactionStatus: AccountBridge<
  Transaction,
  MinaAccount,
  TransactionStatus
>["getTransactionStatus"] = async (a: MinaAccount, t: Transaction): Promise<TransactionStatus> => {
  const errors: StatusErrorMap = {};
  const warnings: StatusErrorMap = {};
  const useAllAmount = !!t.useAllAmount;

  if (t.txType !== "stake" && t.fees.fee.lte(0)) {
    errors.fees = new FeeNotLoaded();
  }

  validateRecipient(t, a, errors);

  if (!validateMemo(t.memo)) {
    errors.transaction = new InvalidMemoMina();
  }

  validateAccountCreationFee(t, a, errors, warnings);

  const estimatedFees = t.fees.fee || new BigNumber(0);
  const maxAmountWithFees = getMaxAmount(a, t, estimatedFees);
  const totalSpent = getTotalSpent(a, t, estimatedFees);
  const amount = useAllAmount ? maxAmountWithFees : new BigNumber(t.amount);

  if (t.txType !== "stake" && amount.lte(0) && !t.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  if (amount.gt(maxAmountWithFees)) {
    errors.amount = new NotEnoughBalance();
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
