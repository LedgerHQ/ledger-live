import { BigNumber } from "bignumber.js";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { getMainAccount } from "../../account";
import type { IconAccount, Transaction } from "./types";
import { TRANSACTION_FEE } from "./constants";

/**
 * Returns the maximum possible amount for transaction
 *
 * @param {Object} param - the account, parentAccount and transaction
 */
const estimateMaxSpendable = async ({
  account,
  parentAccount,
}: {
  account: AccountLike;
  parentAccount?: Account;
  transaction?: Transaction;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount) as IconAccount;
  return a.spendableBalance.minus(TRANSACTION_FEE);
};

export default estimateMaxSpendable;
