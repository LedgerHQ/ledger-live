import BigNumber from "bignumber.js";
import type { Transaction } from "./types";

const createTransaction = (): Transaction => ({
  family: "aptos",
  mode: "send",
  amount: BigNumber(0),
  recipient: "",
  useAllAmount: false,
});

export default createTransaction;
