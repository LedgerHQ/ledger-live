import { BigNumber } from "bignumber.js";

import type { AccountLike, Account } from "@ledgerhq/types-live";
import { getMainAccount } from "../../account";

import type { Transaction } from "./types";

import { createTransaction } from "./js-transaction";
import getEstimatedFees from "./js-getFeesForTransaction";

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
  parentAccount?: Account;
  transaction?: Transaction;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount);
  const t = {
    ...createTransaction(),
    ...transaction,
    amount: a.spendableBalance,
  };

  const fees = await getEstimatedFees({ a, t });

  const pendingTransactionsBalance = a.pendingOperations.reduce(
    (sum, current) => sum.plus(current.value),
    new BigNumber(0)
  );

  const maxSpendable = a.spendableBalance
    .minus(fees)
    .minus(pendingTransactionsBalance);

  return maxSpendable.gte(0) ? maxSpendable : new BigNumber(0);
};

export default estimateMaxSpendable;
