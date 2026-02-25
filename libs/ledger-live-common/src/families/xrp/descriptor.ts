import type { CoinDescriptor } from "../../bridge/descriptor";

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
    amount: {
      canSendMax: false,
    },
  },
};
