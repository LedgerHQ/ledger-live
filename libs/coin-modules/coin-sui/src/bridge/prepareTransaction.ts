import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/index";
import { updateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { AccountBridge } from "@ledgerhq/types-live";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import type { SuiTransactionMode, SuiAccount, Transaction } from "../types";
import getFeesForTransaction from "./getFeesForTransaction";
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
  let mode: SuiTransactionMode = transaction.mode ?? "send";
  let coinType = DEFAULT_COIN_TYPE;
  const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");
  const tokenId = subAccount?.token.id;

  if (subAccount) {
    mode = "token.send";
    coinType = subAccount?.token.contractAddress || DEFAULT_COIN_TYPE;
  }

  // The mode decides how send max and the fees are computed, so it is settled first: a token
  // transaction can arrive still in the default "send" mode, whose maximum is the SUI balance.
  const settled: Transaction = { ...transaction, mode };

  const amount = settled.useAllAmount
    ? calculateAmount({ account, transaction: settled })
    : settled.amount;

  const { fees, gasBudget } = await getFeesForTransaction({
    account,
    transaction: settled,
  });

  const patch: Partial<Transaction> = {
    amount,
    fees,
    gasBudget,
    mode,
    coinType,
    ...(tokenId ? { tokenId } : {}),
  };

  return updateTransaction(transaction, patch);
};

export default prepareTransaction;
