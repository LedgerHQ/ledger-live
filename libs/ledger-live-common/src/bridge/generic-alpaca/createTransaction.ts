import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export function createTransaction(account: Account): any {
  return {
    family: account.currency.family,
    amount: new BigNumber(0),
    recipient: "",
  };
}
