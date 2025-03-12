import { BigNumber } from "bignumber.js";
import { InvalidAddress } from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
import type { SuiAccount, Transaction, TransactionStatus } from "../types";
import { isValidSuiAddress } from "@mysten/sui/utils";

export const getTransactionStatus: AccountBridge<
  Transaction,
  SuiAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const amount = new BigNumber(transaction?.amount || 0);
  const estimatedFees = new BigNumber(transaction?.fees || 0);
  const totalSpent = amount.plus(estimatedFees);

  if (account) {
    //
  }

  if (transaction) {
    if (transaction.recipient && !isValidSuiAddress(transaction.recipient)) {
      errors.recipient = new InvalidAddress(undefined, {
        currencyName: account.currency.name,
      });
    }
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount: amount.lt(0) ? new BigNumber(0) : amount,
    totalSpent,
  };
};

export default getTransactionStatus;
