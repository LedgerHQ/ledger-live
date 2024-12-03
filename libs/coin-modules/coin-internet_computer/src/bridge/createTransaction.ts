import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import BigNumber from "bignumber.js";
import { getEstimatedFees } from "./bridgeHelpers/fee";

export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => {
  // log("debug", "[createTransaction] creating base tx");
  return {
    family: "internet_computer",
    amount: new BigNumber(0),
    fees: getEstimatedFees(),
    recipient: "",
    useAllAmount: false,
  };
};
