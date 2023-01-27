import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "../../account";
import type { Transaction } from "./types";
import { getFees } from "./api";
import { createTransaction } from "./js-transaction";

/**
 * Returns the maximum possible amount for transaction
 *
 * @param {Object} param - the account, parentAccount and transaction
 */
const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const tx: Transaction = {
    ...createTransaction(),
    subAccountId: account.type === "Account" ? null : account.id,
    ...transaction,
    useAllAmount: true,
  };

  const tokenAccount =
    tx.subAccountId &&
    mainAccount.subAccounts &&
    mainAccount.subAccounts.find((ta) => ta.id === tx.subAccountId);

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
