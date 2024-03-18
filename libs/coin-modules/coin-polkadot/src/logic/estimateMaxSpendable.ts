import { BigNumber } from "bignumber.js";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { PolkadotAccount, Transaction } from "../types";
import { calculateAmount } from "./utils";
import getEstimatedFees from "./getFeesForTransaction";
import { createTransaction } from "./transaction";

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
  parentAccount: Account | null | undefined;
  transaction: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount) as PolkadotAccount;
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

export default estimateMaxSpendable;
