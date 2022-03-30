import { getMainAccount } from "../../account";
import createTransaction from "./js-createTransaction";
import prepareTransaction from "./js-prepareTransaction";
import getTransactionStatus from "./js-getTransactionStatus";
import { notCreatedStellarMockAddress } from "./test-dataset";
import type { Account, AccountLike } from "../../types";
import type { Transaction } from "./types";
import BigNumber from "bignumber.js";

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
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    ...transaction,
    recipient: transaction?.recipient || notCreatedStellarMockAddress,
    // not used address
    useAllAmount: true,
  });
  const s = await getTransactionStatus(mainAccount, t);
  return s.amount;
};

export default estimateMaxSpendable;
