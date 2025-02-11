import { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { InvalidAddressBecauseDestinationIsAlsoSource, RecipientRequired } from "@ledgerhq/errors";
import type { SuiAccount, Transaction } from "../types";
import getEstimatedFees from "./getFeesForTransaction";
import BigNumber from "bignumber.js";

const sameFees = (a: BigNumber, b?: BigNumber | null) => (!a || !b ? a === b : a.eq(b));

/**
 * Calculate fees for the current transaction
 * @param {SuiAccount} account
 * @param {Transaction} transaction
 */
export const prepareTransaction: AccountBridge<
  Transaction,
  SuiAccount
>["prepareTransaction"] = async (account, transaction) => {
  console.log("prepareTransaction", account, transaction);

  let fees = transaction.fees;
  fees = await getEstimatedFees({
    account,
    transaction,
  });

  if (!sameFees(fees, transaction.fees)) {
    return { ...transaction, fees };
  }

  const errors: Record<string, Error> = {};

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (account.freshAddress === transaction.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } // TODO: add check for same valid sui address

  // TODO: add check for amount

  const patch: Partial<Transaction> = {
    errors,
  };

  return updateTransaction(transaction, patch);
};

export default prepareTransaction;
