import BigNumber from "bignumber.js";
import { Transaction } from "../types";
import { AccountBridge } from "@ledgerhq/types-live";

export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "xrp",
  amount: new BigNumber(0),
  recipient: "",
  fee: null,
  tag: undefined,
  networkInfo: null,
  feeCustomUnit: null,
});
