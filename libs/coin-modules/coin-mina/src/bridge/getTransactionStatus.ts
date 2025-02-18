import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import type { Transaction, MinaAccount, TransactionStatus, StatusErrorMap } from "../types/common";
import { isValidAddress, isValidMemo, getMaxAmount, getTotalSpent } from "../common-logic";
import { AccountBridge } from "@ledgerhq/types-live";
import { AccountCreationFeeWarning, InvalidMemoMina, AmountTooSmall } from "./errors";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";

const getTransactionStatus: AccountBridge<
  Transaction,
  MinaAccount,
  TransactionStatus
>["getTransactionStatus"] = async (a: MinaAccount, t: Transaction): Promise<TransactionStatus> => {
  const errors: StatusErrorMap = {};
  const warnings: StatusErrorMap = {};
  const useAllAmount = !!t.useAllAmount;

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  }

  if (t.recipient && !isValidAddress(t.recipient)) {
    errors.recipient = new InvalidAddress();
  }

  if (t.memo && !isValidMemo(t.memo)) {
    errors.transaction = new InvalidMemoMina();
  }

  if (t.recipient === a.freshAddress) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (t.fees?.accountCreationFee.gt(0)) {
    const fee = formatCurrencyUnit(a.currency.units[0], t.fees.accountCreationFee, {
      showCode: true,
      disableRounding: true,
    });
    warnings.recipient = new AccountCreationFeeWarning(undefined, {
      fee,
    });

    if (t.amount.lt(t.fees.accountCreationFee) && t.amount.gt(0)) {
      errors.amount = new AmountTooSmall(undefined, {
        amount: fee,
      });
    }
  }

  const estimatedFees = t.fees.fee || new BigNumber(0);

  const maxAmountWithFees = getMaxAmount(a, t, estimatedFees);

  const totalSpent = getTotalSpent(a, t, estimatedFees);
  const amount = useAllAmount ? maxAmountWithFees : new BigNumber(t.amount);

  if (amount.lte(0) && !t.useAllAmount) {
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
