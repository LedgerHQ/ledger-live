import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { calculateAmount, getEstimatedFees } from "./utils";

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
  const [{ amount }, estimatedFees] = await Promise.all([
    calculateAmount({ account, transaction }),
    getEstimatedFees(account),
  ]);

  // `maxFee` must be explicitly set to avoid the @hashgraph/sdk default fallback
  // this ensures device app validation passes (e.g. during swap flow)
  // it's applied via `tx.setMaxTransactionFee` when building the transaction
  transaction.maxFee = estimatedFees;

  transaction.amount = amount;

  return transaction;
};
