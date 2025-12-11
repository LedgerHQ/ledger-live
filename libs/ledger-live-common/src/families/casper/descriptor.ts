import type { CoinDescriptor } from "@ledgerhq/coin-framework/features/types";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {
      memo: {
        type: "tag",
      },
    },
    fees: {
      hasPresets: false,
      hasCustom: false,
    },
  },
};
