// @flow
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import StellarSdk from "stellar-sdk";
import { AmountRequired, FeeNotLoaded } from "@ledgerhq/errors";
import type { Account } from "../../types";
import type { Transaction } from "./types";
import {
  buildPaymentOperation,
  buildCreateAccountOperation,
  buildTransactionBuilder,
  loadAccount,
} from "./api";
import { addressExists } from "./logic";

/**
 * @param {Account} a
 * @param {Transaction} t
 */
export const buildTransaction = async (
  account: Account,
  transaction: Transaction
) => {
  const {
    recipient,
    useAllAmount,
    networkInfo,
    fees,
    memoType,
    memoValue,
  } = transaction;
  if (!fees) {
    throw new FeeNotLoaded();
  }

  invariant(networkInfo && networkInfo.family === "stellar", "stellar family");

  let amount = BigNumber(0);
  amount = useAllAmount
    ? account.balance.minus(networkInfo.baseReserve).minus(fees)
    : transaction.amount;

  if (!amount) throw new AmountRequired();

  const source = await loadAccount(account.freshAddress);
  const transactionBuilder = buildTransactionBuilder(source, fees);

  let operation = null;

  const recipientExists = await addressExists(transaction.recipient); // FIXME: use cache with checkRecipientExist instead?
  if (recipientExists) {
    operation = buildPaymentOperation(recipient, amount);
  } else {
    operation = buildCreateAccountOperation(recipient, amount);
  }

  transactionBuilder.addOperation(operation);

  let memo = null;

  if (memoType && memoValue) {
    switch (memoType) {
      case "MEMO_TEXT":
        memo = StellarSdk.Memo.text(memoValue);
        break;

      case "MEMO_ID":
        memo = StellarSdk.Memo.id(memoValue);
        break;

      case "MEMO_HASH":
        memo = StellarSdk.Memo.hash(memoValue);
        break;

      case "MEMO_RETURN":
        memo = StellarSdk.Memo.return(memoValue);
        break;
    }
  }

  if (memo) {
    transactionBuilder.addMemo(memo);
  }

  const built = transactionBuilder.setTimeout(0).build();

  return built;
};

export default buildTransaction;
