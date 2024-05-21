import { BigNumber } from "bignumber.js";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { IconAccount, Transaction } from "./types";
import { createTransaction } from "./createTransaction";
import getEstimatedFees from "./getFeesForTransaction";
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
  const acc = getMainAccount(account, parentAccount) as IconAccount;
  const tx = { ...createTransaction(), ...transaction, useAllAmount: true };
  const fees = await getEstimatedFees({
    account: acc,
    transaction: tx,
  });

  return calculateAmount({
    account: acc,
    transaction: { ...tx, fees },
  });
};
