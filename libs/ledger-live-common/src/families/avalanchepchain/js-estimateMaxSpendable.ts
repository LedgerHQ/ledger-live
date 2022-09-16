import { BigNumber } from "bignumber.js";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { getMainAccount } from "../../account";

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
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount);
  return a.spendableBalance;
};

export default estimateMaxSpendable;
