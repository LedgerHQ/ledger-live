import { Transaction } from "../types";
import { BigNumber } from "bignumber.js";

export const createTransaction = (): Transaction => ({
  amount: BigNumber(0),
  recipient: "",
  networkInfo: [],
  useAllAmount: false,
  feesStrategy: "fast",
  family: "kaspa",
});

export default createTransaction;
