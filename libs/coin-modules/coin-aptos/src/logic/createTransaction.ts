import BigNumber from "bignumber.js";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from "../constants";
import type { Transaction } from "../types";

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
