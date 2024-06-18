import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "../types";

export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => {
  return {
    family: "tezos",
    mode: "send",
    amount: new BigNumber(0),
    fees: null,
    gasLimit: null,
    storageLimit: null,
    recipient: "",
    networkInfo: null,
    useAllAmount: false,
    taquitoError: null,
    estimatedFees: null,
  };
};
