import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "./types";
import BigNumber from "bignumber.js";

export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "tron",
  amount: new BigNumber(0),
  useAllAmount: false,
  mode: "send",
  duration: 3,
  recipient: "",
  networkInfo: null,
  resource: null,
  votes: [],
});
