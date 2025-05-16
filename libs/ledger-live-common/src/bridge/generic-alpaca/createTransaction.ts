import { Account, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export function createTransaction(account: Account): TransactionCommon & { family: string } {
  return {
    family: account.currency.family,
    amount: BigNumber(0),
    recipient: "",
  };
}
