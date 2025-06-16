import { Account } from "@ledgerhq/types-live";
import { Transaction as VeChainThorTransaction } from "thor-devkit";
import {
  calculateTransactionInfo,
  isValid,
  calculateClausesVet,
  calculateClausesVtho,
} from "../common-logic";
import { Transaction } from "../types";
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
  const { amount, isTokenAccount, estimatedFees, estimatedGas } = await calculateTransactionInfo(
    account,
    transaction,
  );

  let blockRef = "";

  let clauses: Array<VeChainThorTransaction.Clause> = [];
  if (transaction.recipient && isValid(transaction.recipient)) {
    blockRef = await getBlockRef();
    if (isTokenAccount) {
      clauses = await calculateClausesVtho(transaction.recipient, amount);
    } else {
      clauses = await calculateClausesVet(transaction.recipient, amount);
    }
  }

  const body = { ...transaction.body, gas: estimatedGas, blockRef, clauses };
  return { ...transaction, body, amount, estimatedFees };
};
