import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { SuiAccount, Transaction } from "../types";
import getFeesForTransaction from "./getFeesForTransaction";
import createTransaction from "./createTransaction";
import { calculateAmount } from "./utils";
import { BigNumber } from "bignumber.js";

/**
 * Returns the maximum possible amount for transaction
 * @typedef {Object} EstimateMaxSpendableParams
 * @property {SuiAccount} account - The account from which to estimate the maximum spendable amount.
 * @property {SuiAccount} [parentAccount] - The parent account, if applicable.
 * @property {Transaction} transaction - The transaction details for which to estimate the maximum spendable amount.
 *
 * @returns {Promise<BigNumber>} The estimated maximum spendable amount.
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
