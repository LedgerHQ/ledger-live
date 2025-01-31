import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { SuiAccount, Transaction } from "../types";
import getFeesForTransaction from "./getFeesForTransaction";
import createTransaction from "./createTransaction";
import { calculateAmount } from "./utils";
import { BigNumber } from "bignumber.js";

/**
 * Returns the maximum possible amount for transaction
 *
 * @param {Object} param - the account, parentAccount and transaction
 */
export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount) as SuiAccount;

  const estimatedTransaction = {
    ...createTransaction(account),
    ...transaction,
    useAllAmount: true,
  };
  const fees = await getFeesForTransaction({
    account: mainAccount,
    transaction: estimatedTransaction,
  });
  const amount = new BigNumber(estimatedTransaction.amount).minus(fees);
  return calculateAmount({
    account: mainAccount,
    transaction: { ...estimatedTransaction, amount, fees },
  });
};

export default estimateMaxSpendable;
