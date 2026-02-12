import type { CoinDescriptor } from "../../bridge/descriptor";
import { BigNumber } from "bignumber.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBigNumber(value: unknown): value is BigNumber {
  return BigNumber.isBigNumber(value);
}

type BitcoinFeeItem = {
  speed: string;
  feePerByte: BigNumber;
};

function getSuggestedFeePerByteRange(
  transaction: Record<string, unknown>,
): { min: string; max: string } | null {
  const networkInfo = transaction.networkInfo;
  if (!isRecord(networkInfo)) return null;

  const feeItems = networkInfo.feeItems;
  if (!isRecord(feeItems) || !Array.isArray(feeItems.items)) return null;

  const items = feeItems.items
    .filter((item): item is BitcoinFeeItem => {
      if (!isRecord(item)) return false;
      return typeof item.speed === "string" && isBigNumber(item.feePerByte);
    })
    .map(item => item.feePerByte);

  if (items.length === 0) return null;

  const min = BigNumber.min(...items);
  const max = BigNumber.max(...items);

  return {
    min: min.toFixed(),
    max: max.toFixed(),
  };
}

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {},
    fees: {
      hasPresets: true,
      hasCustom: true,
      hasCoinControl: true,
      presets: {
        legend: { type: "feeRate", unit: "sat/vbyte", valueFrom: "presetAmount" },
        strategyLabelInAmount: "legend",
        getOptions: transaction => {
          if (!isRecord(transaction)) {
            return [];
          }

          const networkInfo = transaction.networkInfo;
          if (!isRecord(networkInfo)) {
            return [];
          }

          const feeItems = networkInfo.feeItems;
          if (!isRecord(feeItems) || !Array.isArray(feeItems.items)) {
            return [];
          }

          const items = feeItems.items
            .filter((item): item is BitcoinFeeItem => {
              if (!isRecord(item)) return false;
              return typeof item.speed === "string" && isBigNumber(item.feePerByte);
            })
            .map(item => ({ speed: item.speed, feePerByte: item.feePerByte }));

          if (items.length === 0) {
            return [];
          }

          // For Bitcoin, we return the feePerByte for each strategy.
          // The bridge will calculate the total fees based on transaction size.
          return [...items].reverse().map(item => ({
            id: item.speed,
            amount: item.feePerByte,
          }));
        },
        shouldEstimateWithBridge: () => true,
      },
      custom: {
        inputs: [
          {
            key: "feePerByte",
            type: "number",
            unitLabel: "sat/vbyte",
            suggestedRange: {
              getRange: transaction => {
                if (!isRecord(transaction)) return null;
                return getSuggestedFeePerByteRange(transaction);
              },
            },
          },
        ],
        getInitialValues: (transaction): Record<string, string> => {
          const empty: Record<string, string> = {};
          if (!isRecord(transaction)) return empty;

          // Use current feePerByte if available
          const feePerByte = transaction.feePerByte;
          if (isBigNumber(feePerByte) && feePerByte.gt(0)) {
            return {
              feePerByte: feePerByte.toFixed(),
            };
          }

          // Otherwise try to use medium preset from networkInfo
          const networkInfo = transaction.networkInfo;
          if (isRecord(networkInfo) && isRecord(networkInfo.feeItems)) {
            const medium = networkInfo.feeItems.medium;
            if (isBigNumber(medium) && medium.gt(0)) {
              return {
                feePerByte: medium.toFixed(),
              };
            }
          }

          return {
            feePerByte: "",
          };
        },
        buildTransactionPatch: values => {
          const feePerByte = new BigNumber(values.feePerByte);
          return {
            feesStrategy: "custom",
            feePerByte:
              feePerByte.isNaN() || feePerByte.isNegative()
                ? new BigNumber(0)
                : feePerByte.integerValue(BigNumber.ROUND_DOWN),
          };
        },
      },
    },
    selfTransfer: "free",
  },
};
