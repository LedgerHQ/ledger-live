import { BigNumber } from "bignumber.js";
import type { Transaction } from "../types";
import { AccountBridge } from "@ledgerhq/types-live";

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => {
  const transaction: Transaction = {
    family: "sui" as const,
    mode: "send",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    fees: null,
    errors: {},
  };
  return transaction;
};

export default createTransaction;
