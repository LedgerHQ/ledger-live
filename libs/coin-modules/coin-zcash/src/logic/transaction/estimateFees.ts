import type { BigNumber } from "bignumber.js";
import type { ZcashTransferType } from "../../types/bridge";
import {
  computeShieldedSpendFee,
  computeTransparentSelectionFee,
} from "../coin-selection";

/**
 * ZIP-317 fee estimation for a given (transferType, input/output count) shape.
 * Mirrors the fee model used by prepareTransaction/coin-selection so an
 * estimate always matches what the native PCZT builder will require.
 */
export function estimateFees(args: {
  transferType: ZcashTransferType;
  transparentInputCount: number;
  orchardSpendCount: number;
  hasChange: boolean;
}): BigNumber {
  const { transferType, transparentInputCount, orchardSpendCount, hasChange } = args;

  if (transparentInputCount > 0) {
    return computeTransparentSelectionFee(
      transparentInputCount,
      hasChange ? 2 : 1,
      transferType,
    );
  }

  return computeShieldedSpendFee(orchardSpendCount, hasChange, transferType);
}
