import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "../../account";
import type { Transaction } from "./types";
import getEstimatedFees from "./getFeesForTransaction";

/**
 * Returns the maximum possible amount for transaction
 *
 * @param {Object} param - the account, parentAccount and transaction
 */
export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const fees = await getEstimatedFees();
  return BigNumber.max(0, mainAccount.spendableBalance.minus(fees));
};

export default estimateMaxSpendable;
