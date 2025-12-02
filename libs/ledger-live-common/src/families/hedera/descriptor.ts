import type { CoinDescriptor } from "@ledgerhq/coin-framework/features/types";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {
      memo: {
        type: "text",
        maxLength: 100,
      },
    },
    fees: {
      hasPresets: false,
      hasCustom: false,
    },
  },
};
