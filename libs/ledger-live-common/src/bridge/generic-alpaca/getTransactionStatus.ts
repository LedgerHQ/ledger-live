import { FeeNotLoaded, InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/errors";
import { AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

// => alpaca validateIntent
export function genericGetTransactionStatus(
  _network,
  _kind,
): AccountBridge<any>["getTransactionStatus"] {
  return async (account, transaction: TransactionCommon & { fees: BigNumber }) => {
    const errors: Record<string, Error> = {};
    const warnings: Record<string, Error> = {};

    if (account.freshAddress === transaction.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    }

    if (!transaction.fees || !transaction.fees.gt(0)) {
      errors.fees = new FeeNotLoaded();
    }

    const estimatedFees = transaction.fees || new BigNumber(0);

    return Promise.resolve({
      errors,
      warnings,
      estimatedFees,
      amount: transaction.amount,
      totalSpent: transaction.amount.plus(transaction.fees),
    });
  };
}
