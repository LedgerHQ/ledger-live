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
    },
    selfTransfer: "free",
  },
};
