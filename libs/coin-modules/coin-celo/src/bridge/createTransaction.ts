import { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { Transaction } from "../types";

export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "celo",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: null,
  mode: "send",
  index: null,
});

export default createTransaction;
