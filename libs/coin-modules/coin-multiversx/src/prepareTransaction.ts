import { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getFees } from "./api";
import { GAS } from "./constants";
import { MultiversXEncodeTransaction } from "./encode";
import { isAmountSpentFromBalance } from "./logic";
import type { Transaction } from "./types";

/**
 * Prepare t before checking status
 *
 * @param {MultiversXAccount} account
 * @param {Transaction} transaction
 */
export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  // What's the point of this extra variable ?
  const preparedTx = transaction;

  const tokenAccount =
    (transaction.subAccountId &&
      account.subAccounts &&
      account.subAccounts.find(ta => ta.id === transaction.subAccountId)) ||
    null;

  if (tokenAccount) {
    preparedTx.data = await MultiversXEncodeTransaction.ESDTTransfer(transaction, tokenAccount);
    preparedTx.gasLimit = GAS.ESDT_TRANSFER;
  } else {
    switch (transaction.mode) {
      case "delegate":
        preparedTx.gasLimit = GAS.DELEGATE;
        preparedTx.data = MultiversXEncodeTransaction.delegate();
        break;
      case "claimRewards":
        preparedTx.gasLimit = GAS.CLAIM;
        preparedTx.data = MultiversXEncodeTransaction.claimRewards();
        break;
      case "withdraw":
        preparedTx.gasLimit = GAS.DELEGATE;
        preparedTx.data = MultiversXEncodeTransaction.withdraw();
        break;
      case "reDelegateRewards":
        preparedTx.gasLimit = GAS.DELEGATE;
        preparedTx.data = MultiversXEncodeTransaction.reDelegateRewards();
        break;
      case "unDelegate":
        preparedTx.gasLimit = GAS.DELEGATE;
        preparedTx.data = MultiversXEncodeTransaction.unDelegate(transaction);
        break;
      case "send":
        break;
      default:
        throw new Error("Unsupported transaction mode: " + transaction.mode);
    }
  }

  if (transaction.useAllAmount) {
    // Set the max amount
    preparedTx.amount = tokenAccount ? tokenAccount.balance : account.spendableBalance;

    // Compute estimated fees for that amount
    preparedTx.fees = await getFees(preparedTx);

    // Adjust max amount according to computed fees
    if (!tokenAccount && isAmountSpentFromBalance(transaction.mode)) {
      preparedTx.amount = preparedTx.amount.gt(preparedTx.fees)
        ? preparedTx.amount.minus(preparedTx.fees)
        : new BigNumber(0);
    }
  } else {
    preparedTx.fees = await getFees(preparedTx);
  }

  return preparedTx;
};
