import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import BigNumber from "bignumber.js";

export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => {
  // log("debug", "[createTransaction] creating base tx");

  return {
    family: "filecoin",
    amount: new BigNumber(0),
    method: 0,
    version: 0,
    nonce: 0,
    gasLimit: new BigNumber(0),
    gasFeeCap: new BigNumber(0),
    gasPremium: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
  };
};
