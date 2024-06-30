import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import type { Transaction, MinaAccount, TransactionStatus, StatusErrorMap } from "./types";
import { isValidAddress, isValidMemo, getMaxAmount, getTotalSpent } from "./logic";
import { AccountBridge } from "@ledgerhq/types-live";
import { InvalidMemoMina } from "./errors";
// import { fetchAccountBalance } from "./api";
// import {} from "./constants";

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

  if (!isValidAddress(t.recipient)) {
    errors.recipient = new InvalidAddress();
  }

  if (t.memo && !isValidMemo(t.memo)) {
    errors.transaction = new InvalidMemoMina();
  }

  if (t.recipient === a.freshAddress) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  const estimatedFees = t.fees || new BigNumber(0);

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
