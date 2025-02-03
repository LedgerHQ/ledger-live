import { AccountBridge } from "@ledgerhq/types-live";
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
  let fees = transaction.fees;
  fees = await getEstimatedFees({
    account,
    transaction,
  });

  if (!sameFees(fees, transaction.fees)) {
    return { ...transaction, fees };
  }

  return transaction;
};

export default prepareTransaction;
