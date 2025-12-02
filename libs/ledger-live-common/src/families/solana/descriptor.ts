import type { CoinDescriptor } from "@ledgerhq/coin-framework/features/types";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {
      memo: {
        type: "text",
        maxLength: 32,
      },
    },
    fees: {
      hasPresets: true,
      hasCustom: false,
    },
  },
};
