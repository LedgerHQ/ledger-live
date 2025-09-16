import { Account } from "@ledgerhq/types-live";
import {
  calculateTransactionInfo,
  calculateClausesVet,
  calculateClausesVtho,
  parseAddress,
} from "../common-logic";
import { Transaction, VechainSDKTransactionClause } from "../types";
import { getBlockRef } from "../network";

/**
 * Prepare transaction before checking status
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const prepareTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<Transaction> => {
  const {
    amount,
    isTokenAccount,
    estimatedFees,
    estimatedGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
  } = await calculateTransactionInfo(account, transaction);

  let blockRef = "";

  let clauses: Array<VechainSDKTransactionClause> = [];
  if (transaction.recipient && parseAddress(transaction.recipient)) {
    blockRef = await getBlockRef();
    if (isTokenAccount) {
      clauses = await calculateClausesVtho(transaction.recipient, amount);
    } else {
      clauses = await calculateClausesVet(transaction.recipient, amount);
    }
  }

  const body = {
    ...transaction.body,
    gas: estimatedGas,
    blockRef,
    clauses,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
  return { ...transaction, body, amount, estimatedFees };
};
