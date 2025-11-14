import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account/helpers";
import type { AccountBridge } from "@ledgerhq/types-live";
import { HEDERA_OPERATION_TYPES } from "../constants";
import { estimateFees } from "../logic/estimateFees";
import { isTokenAssociateTransaction } from "../logic/utils";
import type { Transaction } from "../types";
import { calculateAmount } from "./utils";

/**
 * Gather any more neccessary information for a transaction,
 * potentially from a network.
 *
 * Hedera has fully client-side transactions and the fee
 * is not possible to estimate ahead-of-time.
 *
 */
export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
): Promise<Transaction> => {
  const subAccount = findSubAccountById(account, transaction?.subAccountId || "");
  const isTokenTransaction = isTokenAccount(subAccount);
  let operationType: HEDERA_OPERATION_TYPES;

  if (isTokenAssociateTransaction(transaction)) {
    operationType = HEDERA_OPERATION_TYPES.TokenAssociate;
  } else if (isTokenTransaction) {
    operationType = HEDERA_OPERATION_TYPES.TokenTransfer;
  } else {
    operationType = HEDERA_OPERATION_TYPES.CryptoTransfer;
  }

  // explicitly calculate transaction amount to account for `useAllAmount` flag (send max flow)
  // i.e. if `useAllAmount` has been toggled to true, this is where it will update the transaction to reflect that action
  const [{ amount }, estimatedFees] = await Promise.all([
    calculateAmount({ account, transaction }),
    estimateFees(account.currency, operationType),
  ]);

  // `maxFee` must be explicitly set to avoid the @hashgraph/sdk default fallback
  // this ensures device app validation passes (e.g. during swap flow)
  // it's applied via `tx.setMaxTransactionFee` when building the transaction
  transaction.maxFee = estimatedFees;

  transaction.amount = amount;

  return transaction;
};
