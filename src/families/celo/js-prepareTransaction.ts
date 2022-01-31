import { Account } from "../../types";
import { Transaction } from "./types";
import getFeesForTransaction from "./js-getFeesForTransaction";
import { isValidAddress } from "@celo/utils/lib/address";

const sameFees = (a, b) => (!a || !b ? a === b : a.eq(b));

const prepareTransaction = async (
  account: Account,
  transaction: Transaction
) => {
  if (
    !transaction.recipient ||
    (transaction.recipient && !isValidAddress(transaction.recipient))
  ) {
    return transaction;
  }

  const fees = await getFeesForTransaction({ account, transaction });

  if (!sameFees(transaction.fees, fees)) {
    return { ...transaction, fees };
  }

  return transaction;
};

export default prepareTransaction;
