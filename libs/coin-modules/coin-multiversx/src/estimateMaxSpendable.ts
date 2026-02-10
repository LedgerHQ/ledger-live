import { findSubAccountById, getMainAccount } from "@ledgerhq/coin-framework/account";
import type { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getFees } from "./api";
import { createTransaction } from "./createTransaction";
import type { Transaction } from "./types";

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
  const mainAccount = getMainAccount(account, parentAccount);
  const tx: Transaction = {
    ...createTransaction(account),
    subAccountId: account.type === "Account" ? null : account.id,
    ...transaction,
    useAllAmount: true,
  };

  const tokenAccount = tx.subAccountId
    ? findSubAccountById(mainAccount, tx.subAccountId)
    : undefined;

  if (tokenAccount) {
    return tokenAccount.balance;
  }

  const fees = await getFees(tx);

  if (fees.gt(mainAccount.spendableBalance)) {
    return new BigNumber(0);
  }

  return mainAccount.spendableBalance.minus(fees);
};

export default estimateMaxSpendable;
