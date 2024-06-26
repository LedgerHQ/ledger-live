import BigNumber from "bignumber.js";
import { Transaction } from "../types";

const createTransaction = (): Transaction => ({
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

export default createTransaction;
