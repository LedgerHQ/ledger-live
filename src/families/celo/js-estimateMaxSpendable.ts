import { Account, AccountLike } from "../../types";
import { Transaction } from "./types";
import { BigNumber } from "bignumber.js";
import { getMainAccount } from "../../account";
import getTransactionStatus from "./js-getTransactionStatus";
import prepareTransaction from "./js-prepareTransaction";
import createTransaction from "./js-createTransaction";

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    ...transaction,
    useAllAmount: true,
  });
  const s = await getTransactionStatus(mainAccount, t);
  return s.amount;
};

export default estimateMaxSpendable;
