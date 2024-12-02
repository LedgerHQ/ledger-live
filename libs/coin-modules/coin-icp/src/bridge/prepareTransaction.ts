import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { getAddress, validateAddress } from "./bridgeHelpers/addresses";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  // log("debug", "[prepareTransaction] start fn");

  const { address } = getAddress(account);
  const { recipient } = transaction;

  let amount = transaction.amount;
  if (recipient && address) {
    // log("debug", "[prepareTransaction] fetching estimated fees");

    if ((await validateAddress(recipient)).isValid && (await validateAddress(address)).isValid) {
      if (transaction.useAllAmount) {
        amount = account.spendableBalance.minus(transaction.fees);
        return { ...transaction, amount };
      }
    }
  }

  // log("debug", "[prepareTransaction] finish fn");
  return transaction;
};
