import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { calculateAmount } from "./utils";

/**
 * Gather any more neccessary information for a transaction,
 * potentially from a network.
 *
 * Hedera has fully client-side transactions and the fee
 * is not possible to estimate ahead-of-time.
 *
 * @returns  {Transaction}
 */
export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  // explicitly calculate transaction amount to account for `useAllAmount` flag (send max flow)
  // i.e. if `useAllAmount` has been toggled to true, this is where it will update the transaction to reflect that action
  const { amount } = await calculateAmount({ account, transaction });
  transaction.amount = amount;

  return transaction;
};
