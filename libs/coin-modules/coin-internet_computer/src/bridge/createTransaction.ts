import { AccountBridge } from "@ledgerhq/types-live";
import {
  ICPAccountRaw,
  ICPAccount,
  TransactionStatus,
  Transaction,
  InternetComputerOperation,
} from "../types";
import BigNumber from "bignumber.js";
import { getEstimatedFees } from "./bridgeHelpers/fee";

export const createTransaction: AccountBridge<
  Transaction,
  ICPAccount,
  TransactionStatus,
  InternetComputerOperation,
  ICPAccountRaw
>["createTransaction"] = () => {
  // log("debug", "[createTransaction] creating base tx");
  return {
    family: "internet_computer",
    amount: new BigNumber(0),
    type: "send",
    fees: getEstimatedFees(),
    recipient: "",
    useAllAmount: false,
  };
};
