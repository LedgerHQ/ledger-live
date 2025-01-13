import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "../types";

export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => {
  // log("debug", "[createTransaction] creating base tx");

  return {
    family: "casper",
    amount: new BigNumber(0),
    fees: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
  };
};
