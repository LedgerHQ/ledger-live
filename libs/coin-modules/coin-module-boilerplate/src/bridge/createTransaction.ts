import BigNumber from "bignumber.js";
import { Transaction } from "../types";
import { AccountBridge } from "@ledgerhq/types-live";

// We create an empty transaction that will be filled later
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "boilerplate",
  amount: new BigNumber(0),
  recipient: "",
  fee: null,
  memo: undefined,
  networkInfo: null,
  feeCustomUnit: null,
});
