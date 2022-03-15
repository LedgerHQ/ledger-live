import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import { BigNumber } from "bignumber.js";
import { getMainAccount } from "../../account";
import type { Account, AccountLike } from "../../types";
import createTransaction from "./js-createTransaction";
import getTransactionStatus from "./js-getTransactionStatus";
import prepareTransaction from "./js-prepareTransaction";
import type { Transaction } from "./types";

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
    recipient:
      transaction?.recipient || getAbandonSeedAddress(mainAccount.currency.id),
    useAllAmount: true,
  });

  const s = await getTransactionStatus(mainAccount, t);
  return s.amount;
};

export default estimateMaxSpendable;
