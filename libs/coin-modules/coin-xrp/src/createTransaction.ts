import BigNumber from "bignumber.js";
import { Transaction } from "./types";

export const createTransaction = (): Transaction => ({
  family: "xrp",
  amount: new BigNumber(0),
  recipient: "",
  fee: null,
  tag: undefined,
  networkInfo: null,
  feeCustomUnit: null,
});
