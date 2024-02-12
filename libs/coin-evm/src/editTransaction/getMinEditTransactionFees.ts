import { getEnv } from "@ledgerhq/live-env";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "../types/transaction";

/**
 * Returns the minimum fees values to update a legacy transaction
 * ⚠️ Makes sure the updated fees are at least 10% higher than the original fees
 * since this is the minimum increase required by most nodes
 */
export const getMinLegacyFees = ({
  gasPrice,
}: {
  gasPrice: BigNumber;
}): { gasPrice: BigNumber } => {
  const gasPriceFactor: number = getEnv("EVM_REPLACE_TX_LEGACY_GASPRICE_FACTOR");
  return {
    gasPrice: gasPrice.times(gasPriceFactor).integerValue(BigNumber.ROUND_CEIL),
  };
};

/**
 * Returns the minimum fees values to update an EIP1559 transaction
 * ⚠️ Makes sure the updated fees are at least 10% higher than the original fees
 * since this is the minimum increase required by most nodes
 */
export const getMinEip1559Fees = ({
  maxFeePerGas,
  maxPriorityFeePerGas,
}: {
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
}): {
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
} => {
  const maxFeePerGasFactor: number = getEnv("EVM_REPLACE_TX_EIP1559_MAXFEE_FACTOR");
  const maxPriorityFeePerGasFactor: number = getEnv("EVM_REPLACE_TX_EIP1559_MAXPRIORITYFEE_FACTOR");

  return {
    maxFeePerGas: maxFeePerGas.times(maxFeePerGasFactor).integerValue(BigNumber.ROUND_CEIL),
    maxPriorityFeePerGas: maxPriorityFeePerGas
      .times(maxPriorityFeePerGasFactor)
      .integerValue(BigNumber.ROUND_CEIL),
  };
};

/**
 * Returns the minimum fees values to update a evm transaction
 * ⚠️ Makes sure the updated fees are at least 10% higher than the original fees
 * since this is the minimum increase required by most nodes
 */
export const getMinFees = ({
  transaction,
}: {
  transaction: Transaction;
}): {
  gasPrice?: BigNumber;
  maxFeePerGas?: BigNumber;
  maxPriorityFeePerGas?: BigNumber;
} => {
  if (transaction.type === 2) {
    const { maxFeePerGas, maxPriorityFeePerGas } = transaction;
    return getMinEip1559Fees({ maxFeePerGas, maxPriorityFeePerGas });
  } else {
    const { gasPrice } = transaction;
    return getMinLegacyFees({ gasPrice });
  }
};
