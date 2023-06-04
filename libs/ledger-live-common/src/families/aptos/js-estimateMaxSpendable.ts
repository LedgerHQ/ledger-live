import type { Account, AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getMainAccount } from "../../account";
import type { Transaction } from "./types";
import { getMaxSendBalance } from "./logic";

const estimateMaxSpendable = async ({
  account,
  parentAccount,
}: {
  account: AccountLike;
  parentAccount: Account;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);

  return getMaxSendBalance(mainAccount.spendableBalance);
};

export default estimateMaxSpendable;
