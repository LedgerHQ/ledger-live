import { MinimalGasLimitTransaction, Transaction } from "./types";
import { Account } from "@ledgerhq/types-live";

/**
 * Returns only the strict minimum needed from a transaction to
 * determine its gas limit.
 *
 * @param account
 * @param transaction
 * @returns { from: string, value: string, data: string }
 */
export const getMinimalGasLimitTransaction = (
  account: Account,
  transaction: Transaction
): MinimalGasLimitTransaction => ({
  from: account.freshAddress,
  value: "0x" + (transaction.amount.toString(16) || "0"),
  data: "0x" + (transaction.data?.toString("hex") || "0"),
});

export default {
  getMinimalGasLimitTransaction,
};
