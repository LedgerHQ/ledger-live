import type { CoinDescriptor } from "@ledgerhq/coin-framework/features/types";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {
      memo: {
        type: "tag",
        maxValue: 4294967295, // UINT32_MAX
      },
    },
    fees: {
      hasPresets: false,
      hasCustom: false,
    },
  },
};
