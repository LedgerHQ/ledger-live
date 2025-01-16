import BigNumber from "bignumber.js";
import type { Transaction } from "../types";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from "./logic";

const createTransaction = (): Transaction => ({
  family: "aptos",
  mode: "send",
  amount: BigNumber(0),
  recipient: "",
  useAllAmount: false,
  options: {
    maxGasAmount: DEFAULT_GAS.toString(),
    gasUnitPrice: DEFAULT_GAS_PRICE.toString(),
  },
});

export default createTransaction;
