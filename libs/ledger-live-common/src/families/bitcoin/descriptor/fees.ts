import { BigNumber } from "bignumber.js";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { FeeDescriptor } from "../../../bridge/descriptor/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBigNumber(value: unknown): value is BigNumber {
  return BigNumber.isBigNumber(value);
}

function getFeePerVByteUnit(currency: CryptoOrTokenCurrency): string | undefined {
  const unit = currency.units.find(unit => unit.magnitude === 0);
  return unit ? `${unit.code}/vbyte` : undefined;
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

export const fees: FeeDescriptor = {
  hasPresets: true,
  hasCustom: true,
  hasCoinControl: true,
  presets: {
    legend: { type: "feeRate", unit: getFeePerVByteUnit, valueFrom: "presetAmount" },
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
        unitLabel: getFeePerVByteUnit,
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

      const feePerByte = transaction.feePerByte;
      if (isBigNumber(feePerByte) && feePerByte.gt(0)) {
        return {
          feePerByte: feePerByte.toFixed(),
        };
      }

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
};
