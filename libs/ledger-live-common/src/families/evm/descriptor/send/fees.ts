import { BigNumber } from "bignumber.js";
import type {
  CustomFeeConfig,
  CustomFeeInputDescriptor,
} from "../../../../bridge/descriptor/types";

const GWEI_DIVISOR = new BigNumber(10).pow(9);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isBigNumber(value: unknown): value is BigNumber {
  return BigNumber.isBigNumber(value);
}

export function weiToGwei(wei: BigNumber): string {
  return wei.dividedBy(GWEI_DIVISOR).decimalPlaces(6, BigNumber.ROUND_DOWN).toFixed();
}

export function gweiToWei(gwei: string): BigNumber {
  const val = new BigNumber(gwei);
  if (val.isNaN() || val.isNegative()) return new BigNumber(0);
  return val.times(GWEI_DIVISOR).integerValue(BigNumber.ROUND_DOWN);
}

/**
 * Determine whether the EVM transaction is EIP-1559 (type 2).
 * Falls back to checking gasOptions for maxFeePerGas presence.
 */
export function isEip1559(transaction: Record<string, unknown>): boolean {
  if (transaction.type === 2) return true;
  const gasOptions = transaction.gasOptions;
  if (isRecord(gasOptions)) {
    const medium = gasOptions.medium;
    if (isRecord(medium) && isBigNumber(medium.maxFeePerGas)) return true;
  }
  return false;
}

function getSuggestedPriorityFeeRange(transaction: Record<string, unknown>): {
  min: string;
  max: string;
} | null {
  const gasOptions = transaction.gasOptions;
  if (!isRecord(gasOptions)) return null;

  const slow = gasOptions.slow;
  const fast = gasOptions.fast;
  if (!isRecord(slow) || !isRecord(fast)) return null;

  const slowPriorityFee = isBigNumber(slow.maxPriorityFeePerGas)
    ? slow.maxPriorityFeePerGas
    : new BigNumber(0);
  const fastPriorityFee = isBigNumber(fast.maxPriorityFeePerGas)
    ? fast.maxPriorityFeePerGas
    : new BigNumber(0);
  if (slowPriorityFee.isZero() && fastPriorityFee.isZero()) return null;

  return {
    min: weiToGwei(slowPriorityFee),
    max: weiToGwei(fastPriorityFee),
  };
}

function getNextBlockBaseFee(transaction: Record<string, unknown>): string | null {
  const gasOptions = transaction.gasOptions;
  if (!isRecord(gasOptions)) return null;

  const medium = gasOptions.medium;
  if (!isRecord(medium)) return null;

  // The gas tracker provides a `nextBaseFee` (base fee), which is what we want to display
  // for the "Next block" helper under maxFeePerGas.
  const nextBaseFee = medium.nextBaseFee;
  if (!isBigNumber(nextBaseFee)) return null;
  return `${weiToGwei(nextBaseFee)} Gwei`;
}

/** Custom fee input descriptors for EIP-1559 transactions */
export const eip1559Inputs: readonly CustomFeeInputDescriptor[] = [
  {
    key: "maxPriorityFeePerGas",
    type: "number",
    unitLabel: "Gwei",
    suggestedRange: {
      getRange: transaction => {
        if (!isRecord(transaction)) return null;
        return getSuggestedPriorityFeeRange(transaction);
      },
    },
  },
  {
    key: "maxFeePerGas",
    type: "number",
    unitLabel: "Gwei",
    helperInfo: {
      getValue: transaction => {
        if (!isRecord(transaction)) return null;
        return getNextBlockBaseFee(transaction);
      },
    },
  },
];

export const legacyInputs: readonly CustomFeeInputDescriptor[] = [
  {
    key: "gasPrice",
    type: "number",
    unitLabel: "Gwei",
  },
];

export const evmCustomFeeConfig: CustomFeeConfig = {
  inputs: [...eip1559Inputs, ...legacyInputs],
  getInitialValues: (transaction): Record<string, string> => {
    const empty: Record<string, string> = {};
    if (!isRecord(transaction)) return empty;

    const is1559 = isEip1559(transaction);
    if (is1559) {
      const maxFeePerGas = transaction.maxFeePerGas;
      const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas;

      if (isBigNumber(maxFeePerGas) && isBigNumber(maxPriorityFeePerGas)) {
        return {
          maxFeePerGas: weiToGwei(maxFeePerGas),
          maxPriorityFeePerGas: weiToGwei(maxPriorityFeePerGas),
        };
      }

      // Fallback to medium preset from gasOptions
      const gasOptions = transaction.gasOptions;
      if (isRecord(gasOptions)) {
        const medium = gasOptions.medium;
        if (isRecord(medium)) {
          const mediumMaxFee = medium.maxFeePerGas;
          const mediumPriorityFee = medium.maxPriorityFeePerGas;
          return {
            maxFeePerGas: isBigNumber(mediumMaxFee) ? weiToGwei(mediumMaxFee) : "",
            maxPriorityFeePerGas: isBigNumber(mediumPriorityFee)
              ? weiToGwei(mediumPriorityFee)
              : "",
          };
        }
      }

      return {
        maxFeePerGas: "",
        maxPriorityFeePerGas: "",
      };
    }

    // Legacy transaction
    const gasPrice = transaction.gasPrice;
    const gasOptions = transaction.gasOptions;
    const medium = isRecord(gasOptions) ? gasOptions.medium : undefined;
    if (!isBigNumber(gasPrice) && isRecord(gasOptions) && isRecord(medium)) {
      const mediumGasPrice = medium.gasPrice;
      return {
        gasPrice: isBigNumber(mediumGasPrice) ? weiToGwei(mediumGasPrice) : "",
      };
    }

    return {
      gasPrice: isBigNumber(gasPrice) ? weiToGwei(gasPrice) : "",
    };
  },
  buildTransactionPatch: values => {
    const patch: Record<string, unknown> = {
      feesStrategy: "custom",
    };

    if ("maxFeePerGas" in values) {
      patch.maxFeePerGas = gweiToWei(values.maxFeePerGas);
    }
    if ("maxPriorityFeePerGas" in values) {
      patch.maxPriorityFeePerGas = gweiToWei(values.maxPriorityFeePerGas);
    }
    if ("gasPrice" in values) {
      patch.gasPrice = gweiToWei(values.gasPrice);
    }
    return patch;
  },
};
