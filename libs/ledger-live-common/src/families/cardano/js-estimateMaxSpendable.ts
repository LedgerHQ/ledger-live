import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { getMainAccount } from "../../account";
import type { CardanoAccount, Transaction } from "./types";
import { createTransaction } from "./js-transaction";
import {
  address as TyphonAddress,
  types as TyphonTypes,
  Transaction as TyphonTransaction,
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

  const dummyRecipient =
    "addr1qyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv2t5am";
  const a = getMainAccount(account, parentAccount);
  const t: Transaction = {
    ...createTransaction(),
    ...transaction,
    recipient: dummyRecipient,
    // amount field will not be used to build a transaction when useAllAmount is true
    amount: new BigNumber(0),
    useAllAmount: true,
  };
  let typhonTransaction: TyphonTransaction;
  try {
    typhonTransaction = await buildTransaction(a as CardanoAccount, t);
  } catch (error) {
    log("cardano-error", "Failed to estimate max spendable: " + String(error));
    return new BigNumber(0);
  }
  const transactionAmount = typhonTransaction
    .getOutputs()
    .filter(
      o =>
        !(o.address instanceof TyphonAddress.BaseAddress) ||
        !(o.address.paymentCredential.type === TyphonTypes.HashType.ADDRESS) ||
        o.address.paymentCredential.bipPath === undefined,
    )
    .reduce((total, o) => total.plus(o.amount), new BigNumber(0));

  return transactionAmount;
};

export default estimateMaxSpendable;
