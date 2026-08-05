import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction } from "../types";
import { getEstimatedFees } from "./bridgeHelpers/fee";

export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => {
  // log("debug", "[createTransaction] creating base tx");
  return {
    family: "internet_computer",
    type: "send",
    amount: new BigNumber(0),
    fees: getEstimatedFees(),
    recipient: "",
    useAllAmount: false,
  };
};
