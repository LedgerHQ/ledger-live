import BigNumber from "bignumber.js";
import type { Transaction } from "./types";

export const getGasLimit = (tx: Transaction): BigNumber => tx.customGasLimit ?? tx.gasLimit;

export const getEstimatedFees = (tx: Transaction): BigNumber => {
  const gasLimit = getGasLimit(tx);
  if (tx.type !== 2) {
    return tx.gasPrice?.multipliedBy(gasLimit) || new BigNumber(0);
  }
  return tx.maxFeePerGas?.multipliedBy(gasLimit) || new BigNumber(0);
};
