import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { PolkadotAccount, Transaction } from "../types";
import getEstimatedFees from "./getFeesForTransaction";

const sameFees = (a: BigNumber, b?: BigNumber | null) => (!a || !b ? a === b : a.eq(b));

/**
 * Calculate fees for the current transaction
 * @param {PolkadotAccount} account
 * @param {Transaction} transaction
 */
export const prepareTransaction: AccountBridge<
  Transaction,
  PolkadotAccount
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
