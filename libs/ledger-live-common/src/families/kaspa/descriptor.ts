import type { CoinDescriptor } from "../../bridge/descriptor";
import { BigNumber } from "bignumber.js";

type KaspaNetworkInfoItem = {
  label: string;
  amount: BigNumber;
  estimatedSeconds: number;
};

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {},
    fees: {
      hasPresets: true,
      hasCustom: true,
      presets: {
        legend: { type: "feeRate", unit: "Sompi/byte", valueFrom: "presetAmount" },
        strategyLabelInAmount: "legend",
        getOptions: transaction => {
          const info = (transaction as Record<string, unknown>).networkInfo as
            | KaspaNetworkInfoItem[]
            | undefined;
          if (!info?.length) return [];

          const first = info[0];
          // When network congestion is uniform (all strategies have identical confirmation times),
          // disable 'slow' and 'medium' options to simplify UX and guide users toward the fastest option
          const allSame =
            first !== undefined &&
            info.every(
              (item: KaspaNetworkInfoItem) => item.estimatedSeconds === first.estimatedSeconds,
            );

          return info.map((item: KaspaNetworkInfoItem) => ({
            id: item.label,
            amount: item.amount,
            estimatedMs: item.estimatedSeconds * 1000,
            disabled: (item.label === "slow" || item.label === "medium") && allSame,
          }));
        },
      },
    },
  },
};
