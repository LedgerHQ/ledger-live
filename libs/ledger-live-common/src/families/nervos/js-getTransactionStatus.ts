import { Account } from "@ledgerhq/types-live";
import type { NervosAccount, Transaction, TransactionStatus } from "./types";
import { buildTransaction } from "./js-buildTransaction";

export const getTransactionStatus = async (
  a: Account,
  t: Transaction
): Promise<TransactionStatus> => {
  const { status } = await buildTransaction(a as NervosAccount, t);
  return status;
};
