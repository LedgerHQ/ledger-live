import { BigNumber } from "bignumber.js";
import {
  //   NotEnoughBalance,
  //   RecipientRequired,
  InvalidAddress,
  //   InvalidAddressBecauseDestinationIsAlsoSource,
  //   AmountRequired,
  //   NotEnoughBalanceBecauseDestinationNotCreated,
  //   FeeNotLoaded,
} from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
// import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { SuiAccount, Transaction, TransactionStatus } from "../types";
import { isValidSuiAddress } from "@mysten/sui/utils";

// import suiAPI from "../network";

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
  console.log("getstatus", account, transaction);
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
