import { getGasLimit } from "./transaction";
import type { Transaction } from "./types";
import type { FeeStrategy } from "../../types";
import { BigNumber } from "bignumber.js";

export function useFeesStrategy(t: Transaction): FeeStrategy[] {
  const networkInfo = t.networkInfo;

  const calculateEIP1559NetworkFees = (
    maxBaseFeePerGas: BigNumber,
    maxPriorityFeePerGas: BigNumber,
    gasLimit: BigNumber
  ) => maxBaseFeePerGas.plus(maxPriorityFeePerGas).multipliedBy(gasLimit);

  if (!networkInfo) return [];

  const gasLimit = getGasLimit(t);
  let strategies;

  if (networkInfo.gasPrice) {
    strategies = [
      {
        label: "slow",
        amount: networkInfo.gasPrice.min,
        displayedAmount: networkInfo.gasPrice.min.multipliedBy(gasLimit),
      },
      {
        label: "medium",
        amount: networkInfo.gasPrice.initial,
        displayedAmount: networkInfo.gasPrice.initial.multipliedBy(gasLimit),
      },
      {
        label: "fast",
        amount: networkInfo.gasPrice.max,
        displayedAmount: networkInfo.gasPrice.max.multipliedBy(gasLimit),
      },
    ];
  } else if (
    networkInfo.nextBaseFeePerGas &&
    networkInfo.maxPriorityFeePerGas
  ) {
    strategies = [
      {
        label: "slow",
        amount: networkInfo.nextBaseFeePerGas.plus(
          networkInfo.maxPriorityFeePerGas.min
        ),
        displayedAmount: calculateEIP1559NetworkFees(
          networkInfo.nextBaseFeePerGas,
          networkInfo.maxPriorityFeePerGas.min,
          gasLimit
        ),
        txParameters: {
          maxBaseFeePerGas: networkInfo.nextBaseFeePerGas,
          maxPriorityFeePerGas: networkInfo.maxPriorityFeePerGas.min,
        },
      },
      {
        label: "medium",
        amount: networkInfo.nextBaseFeePerGas.plus(
          networkInfo.maxPriorityFeePerGas?.initial
        ),
        displayedAmount: calculateEIP1559NetworkFees(
          networkInfo.nextBaseFeePerGas,
          networkInfo.maxPriorityFeePerGas.initial,
          gasLimit
        ),
        txParameters: {
          maxBaseFeePerGas: networkInfo.nextBaseFeePerGas,
          maxPriorityFeePerGas: networkInfo.maxPriorityFeePerGas.initial,
        },
      },
      {
        label: "fast",
        amount: networkInfo.nextBaseFeePerGas.plus(
          networkInfo.maxPriorityFeePerGas?.max
        ),
        displayedAmount: calculateEIP1559NetworkFees(
          networkInfo.nextBaseFeePerGas,
          networkInfo.maxPriorityFeePerGas.max,
          gasLimit
        ),
        txParameters: {
          maxBaseFeePerGas: networkInfo.nextBaseFeePerGas,
          maxPriorityFeePerGas: networkInfo.maxPriorityFeePerGas.max,
        },
      },
    ];
  }
  return strategies;
}
