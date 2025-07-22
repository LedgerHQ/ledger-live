import { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import type { SuiTransactionMode, SuiAccount, Transaction } from "../types";
import getFeesForTransaction from "./getFeesForTransaction";
import BigNumber from "bignumber.js";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import { calculateAmount } from "./utils";

/**
 * Calculate fees for the current transaction
 * @function prepareTransaction
 * @description Prepares a transaction by calculating the amount, fees, and validating the recipient address.
 * @param {SuiAccount} account - The account from which the transaction is being prepared.
 * @param {Transaction} transaction - The transaction object containing details such as amount, fees, and recipient.
 * @returns {Promise<Transaction>} A promise that resolves to the updated transaction object.
 */
export const prepareTransaction: AccountBridge<
  Transaction,
  SuiAccount
>["prepareTransaction"] = async (account, transaction) => {
  let amount = transaction.amount;

  if (transaction.useAllAmount) {
    amount = calculateAmount({ account, transaction });
  }

  let fees: BigNumber;
  try {
    fees = await getFeesForTransaction({
      account,
      transaction,
    });
  } catch (e) {
    fees = BigNumber(0);
  }

  let mode: SuiTransactionMode = transaction.mode ?? "send";
  let coinType = DEFAULT_COIN_TYPE;
  if (transaction?.subAccountId) {
    mode = "token.send";
    coinType =
      findSubAccountById(account, transaction.subAccountId)?.token.contractAddress ||
      DEFAULT_COIN_TYPE;
  }

  const patch: Partial<Transaction> = {
    amount,
    fees,
    mode,
    coinType,
  };

  return updateTransaction(transaction, patch);
};

export default prepareTransaction;
