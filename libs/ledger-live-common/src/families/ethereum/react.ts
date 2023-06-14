import { BigNumber } from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import type { FeeStrategy } from "@ledgerhq/types-live";
import { getGasLimit } from "./transaction";
import type { Transaction } from "./types";

const calculateEIP1559NetworkFees = (
  maxFeePerGas: BigNumber,
  maxPriorityFeePerGas: BigNumber,
  gasLimit: BigNumber,
): BigNumber => maxFeePerGas.plus(maxPriorityFeePerGas).multipliedBy(gasLimit).integerValue();

export function useFeesStrategy(tx: Transaction): FeeStrategy[] {
  const { networkInfo } = tx;
  const gasLimit = getGasLimit(tx);

  // EIP-1559 transaction
  if (networkInfo?.nextBaseFeePerGas && networkInfo?.maxPriorityFeePerGas) {
    const amplifiedBaseFee = networkInfo.nextBaseFeePerGas
      .times(getEnv("EIP1559_BASE_FEE_MULTIPLIER"))
      .integerValue(); // ensuring valid base fee for 6 blocks with a mutliplier of 2

    return [
      {
        label: "slow",
        amount: amplifiedBaseFee.plus(networkInfo.maxPriorityFeePerGas.min).integerValue(),
        displayedAmount: calculateEIP1559NetworkFees(
          amplifiedBaseFee,
          networkInfo.maxPriorityFeePerGas.min,
          gasLimit,
        ),
        extra: {
          maxFeePerGas: amplifiedBaseFee.plus(networkInfo.maxPriorityFeePerGas.min).integerValue(),
          maxPriorityFeePerGas: networkInfo.maxPriorityFeePerGas.min,
        },
      },
      {
        label: "medium",
        amount: amplifiedBaseFee.plus(networkInfo.maxPriorityFeePerGas.initial).integerValue(),
        displayedAmount: calculateEIP1559NetworkFees(
          amplifiedBaseFee,
          networkInfo.maxPriorityFeePerGas.initial,
          gasLimit,
        ),
        extra: {
          maxFeePerGas: amplifiedBaseFee
            .plus(networkInfo.maxPriorityFeePerGas.initial)
            .integerValue(),
          maxPriorityFeePerGas: networkInfo.maxPriorityFeePerGas.initial,
        },
      },
      {
        label: "fast",
        amount: amplifiedBaseFee.plus(networkInfo.maxPriorityFeePerGas?.max).integerValue(),
        displayedAmount: calculateEIP1559NetworkFees(
          amplifiedBaseFee,
          networkInfo.maxPriorityFeePerGas.max,
          gasLimit,
        ),
        extra: {
          maxFeePerGas: amplifiedBaseFee.plus(networkInfo.maxPriorityFeePerGas.max).integerValue(),
          maxPriorityFeePerGas: networkInfo.maxPriorityFeePerGas.max,
        },
      },
    ];
  }

  return networkInfo?.gasPrice
    ? [
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
      ]
    : [];
}
