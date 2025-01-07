import { Transaction } from "../types";
import { BigNumber } from "bignumber.js";

export const createTransaction = (): Transaction => ({
  amount: BigNumber(0),
  recipient: "",
  useAllAmount: false,
  feesStrategy: "slow",
  family: "kaspa",
  feerate: 1,
  rbf: true,
});

export default createTransaction;
