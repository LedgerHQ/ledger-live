import type { MappedSwapOperation } from "../../swap/types";
import type { SwapTransactionStatusParams } from "../types";

export function fromSwapOperation(
  mappedSwapOperation: MappedSwapOperation,
): SwapTransactionStatusParams {
  const { provider, swapId } = mappedSwapOperation;

  return {
    swapId,
    provider,
  };
}
