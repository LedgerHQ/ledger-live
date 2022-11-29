import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { Transaction } from "./types";

export const createTransaction = (): Transaction => ({
  family: "ethereum",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  gasPrice: null,
  maxFeePerGas: null,
  maxPriorityFeePerGas: null,
  userGasLimit: null,
  estimatedGasLimit: null,
  networkInfo: null,
  feeCustomUnit: getCryptoCurrencyById("ethereum").units[1],
  useAllAmount: false,
  feesStrategy: "medium",
});

export default createTransaction;
