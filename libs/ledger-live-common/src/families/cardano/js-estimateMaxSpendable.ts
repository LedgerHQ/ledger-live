import { BigNumber } from "bignumber.js";

import type { AccountLike, Account } from "../../types";
import { getMainAccount } from "../../account";

import type { Transaction } from "./types";

import { createTransaction } from "./js-transaction";
import {
  address as TyphonAddress,
  types as TyphonTypes,
} from "@stricahq/typhonjs";
import { buildTransaction } from "./js-buildTransaction";

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
  if (account.type === "TokenAccount") {
    return account.balance;
  }

  const a = getMainAccount(account, parentAccount);
  const t = {
    ...createTransaction(),
    ...transaction,
    // amount field will not be used to build a transaction when useAllAmount is true
    amount: new BigNumber(0),
    useAllAmount: true,
  };
  let typhonTransaction;
  try {
    typhonTransaction = await buildTransaction(a, t);
  } catch (error) {
    return new BigNumber(0);
  }
  const transactionAmount = typhonTransaction
    .getOutputs()
    .filter(
      (o) =>
        !(o.address instanceof TyphonAddress.BaseAddress) ||
        !(o.address.paymentCredential.type === TyphonTypes.HashType.ADDRESS) ||
        o.address.paymentCredential.bipPath === undefined
    )
    .reduce((total, o) => total.plus(o.amount), new BigNumber(0));

  return transactionAmount;
};

export default estimateMaxSpendable;
