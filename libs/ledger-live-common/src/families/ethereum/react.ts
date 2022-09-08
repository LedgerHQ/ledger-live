import { BigNumber } from "bignumber.js";
import type { FeeStrategy } from "@ledgerhq/types-live";
import { getGasLimit } from "./transaction";
import type { Transaction } from "./types";

export function useFeesStrategy(t: Transaction): FeeStrategy[] {
  const networkInfo = t.networkInfo;

  const calculateEIP1559NetworkFees = (
    maxBaseFeePerGas: BigNumber,
    maxPriorityFeePerGas: BigNumber,
    gasLimit: BigNumber
  ) =>
    maxBaseFeePerGas
      .plus(maxPriorityFeePerGas)
      .multipliedBy(gasLimit)
      .integerValue();

  if (!networkInfo) return [];

  const gasLimit = getGasLimit(t);
  const slowStrategyBaseFeeMultiplier = 1.2;
  const mediumStrategyBaseFeeMultiplier = 2;
  const fastStrategyBaseFeeMultiplier = 2;
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
        amount: networkInfo.nextBaseFeePerGas
          .times(slowStrategyBaseFeeMultiplier)
          .plus(networkInfo.maxPriorityFeePerGas.min)
          .integerValue(),
        displayedAmount: calculateEIP1559NetworkFees(
          networkInfo.nextBaseFeePerGas.times(slowStrategyBaseFeeMultiplier),
          networkInfo.maxPriorityFeePerGas.min,
          gasLimit
        ),
        txParameters: {
          maxBaseFeePerGas: networkInfo.nextBaseFeePerGas
            .times(slowStrategyBaseFeeMultiplier)
            .integerValue(),
          maxPriorityFeePerGas: networkInfo.maxPriorityFeePerGas.min,
        },
      },
      {
        label: "medium",
        amount: networkInfo.nextBaseFeePerGas
          .times(mediumStrategyBaseFeeMultiplier)
          .plus(networkInfo.maxPriorityFeePerGas?.initial)
          .integerValue(),
        displayedAmount: calculateEIP1559NetworkFees(
          networkInfo.nextBaseFeePerGas.times(mediumStrategyBaseFeeMultiplier),
          networkInfo.maxPriorityFeePerGas.initial,
          gasLimit
        ),
        txParameters: {
          maxBaseFeePerGas: networkInfo.nextBaseFeePerGas
            .times(mediumStrategyBaseFeeMultiplier)
            .integerValue(),
          maxPriorityFeePerGas: networkInfo.maxPriorityFeePerGas.initial,
        },
      },
      {
        label: "fast",
        amount: networkInfo.nextBaseFeePerGas
          .times(fastStrategyBaseFeeMultiplier)
          .plus(networkInfo.maxPriorityFeePerGas?.max)
          .integerValue(),
        displayedAmount: calculateEIP1559NetworkFees(
          networkInfo.nextBaseFeePerGas.times(fastStrategyBaseFeeMultiplier),
          networkInfo.maxPriorityFeePerGas.max,
          gasLimit
        ),
        txParameters: {
          maxBaseFeePerGas: networkInfo.nextBaseFeePerGas
            .times(fastStrategyBaseFeeMultiplier)
            .integerValue(),
          maxPriorityFeePerGas: networkInfo.maxPriorityFeePerGas.max,
        },
      },
    ];
  }
  return strategies;
}
