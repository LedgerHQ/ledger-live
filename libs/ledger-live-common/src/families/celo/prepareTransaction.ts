import { AccountBridge } from "@ledgerhq/types-live";
import { CeloAccount, Transaction, TransactionStatus } from "./types";
import getFeesForTransaction from "./getFeesForTransaction";
import { isValidAddress } from "@celo/utils/lib/address";
import BigNumber from "bignumber.js";

const sameFees = (a, b) => (!a || !b ? a === b : a.eq(b));

export const prepareTransaction: AccountBridge<
  Transaction,
  TransactionStatus,
  CeloAccount
>["prepareTransaction"] = async (account, transaction) => {
  if (transaction.recipient && !isValidAddress(transaction.recipient)) return transaction;

  if (["send", "vote"].includes(transaction.mode) && !transaction.recipient) return transaction;

  if (
    transaction.mode === "vote" &&
    !transaction.useAllAmount &&
    new BigNumber(transaction.amount).lte(0)
  )
    return transaction;

  const fees = await getFeesForTransaction({ account, transaction });

  if (!sameFees(transaction.fees, fees)) {
    return { ...transaction, fees };
  }

  return transaction;
};

export default prepareTransaction;
