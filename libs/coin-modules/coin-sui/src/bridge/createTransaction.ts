import { BigNumber } from "bignumber.js";
import type { Transaction } from "../types";
import { AccountBridge, AccountLike, Account } from "@ledgerhq/types-live";

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = (
  _account: AccountLike<Account>,
) => {
  const transaction: Transaction = {
    family: "sui" as const,
    mode: "send",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    fees: null,
    errors: {},
  };
  console.log("createTransaction", transaction);
  return transaction;
};

export default createTransaction;
