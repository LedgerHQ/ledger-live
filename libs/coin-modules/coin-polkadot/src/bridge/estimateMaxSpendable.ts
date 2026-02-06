import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { PolkadotAccount, Transaction } from "../types";
import createTransaction from "./createTransaction";
import getEstimatedFees from "./getFeesForTransaction";
import { calculateAmount } from "./utils";

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
  const mainAccount = getMainAccount(account, parentAccount) as PolkadotAccount;
  const estimatedTransaction = {
    ...createTransaction(account),
    ...transaction,
    useAllAmount: true,
  };
  const fees = await getEstimatedFees({
    account: mainAccount,
    transaction: estimatedTransaction,
  });
  return calculateAmount({
    account: mainAccount,
    transaction: { ...estimatedTransaction, fees },
  });
};

export default estimateMaxSpendable;
