import { BigNumber } from "bignumber.js";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { IconAccount, Transaction } from "./types";
import { createTransaction } from "./js-createTransaction";
import getEstimatedFees from "./js-getFeesForTransaction";
import { calculateAmount } from "./logic";

/**
 * Returns the maximum possible amount for transaction
 *
 * @param {Object} param - the account, parentAccount and transaction
 */
export const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount) as IconAccount;
  const t = { ...createTransaction(), ...transaction, useAllAmount: true };
  const fees = await getEstimatedFees({
    a,
    t,
  });

  return calculateAmount({
    a,
    t: { ...t, fees },
  });
};
