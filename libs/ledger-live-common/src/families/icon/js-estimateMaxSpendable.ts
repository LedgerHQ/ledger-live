import { BigNumber } from "bignumber.js";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { getMainAccount } from "../../account";

import type { IconAccount, Transaction } from "./types";

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
  const a = getMainAccount(account, parentAccount) as IconAccount;
  const t = {
    ...createTransaction(),
    ...transaction,
    // spendable balance should be minus a bit of fee to prevent out of balance error from the SDK
    amount: a.spendableBalance.minus(1),
  };

  const fees = await getEstimatedFees({ a, t });

  return a.spendableBalance.minus(fees);
};

export default estimateMaxSpendable;
