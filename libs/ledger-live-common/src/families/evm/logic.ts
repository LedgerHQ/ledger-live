import BigNumber from "bignumber.js";
import {
  Transaction as EvmTransaction,
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
} from "./types";

/**
 * Helper to check if a legacy transaction has the right fee property
 */
export const legacyTransactionHasFees = (tx: EvmTransactionLegacy): boolean =>
  Boolean((!tx.type || tx.type < 2) && tx.gasPrice);

/**
 * Helper to check if a legacy transaction has the right fee property
 */
export const eip1559TransactionHasFees = (tx: EvmTransactionEIP1559): boolean =>
  Boolean(tx.type === 2 && tx.maxFeePerGas && tx.maxPriorityFeePerGas);

/**
 * Helper to get total fee value for a tx depending on its type
 */
export const getEstimatedFees = (tx: EvmTransaction): BigNumber => {
  if (tx.type !== 2) {
    return (
      (tx as EvmTransactionLegacy)?.gasPrice?.multipliedBy(tx.gasLimit) ||
      new BigNumber(0)
    );
  }
  return (
    (tx as EvmTransactionEIP1559)?.maxFeePerGas?.multipliedBy(tx.gasLimit) ||
    new BigNumber(0)
  );
};
