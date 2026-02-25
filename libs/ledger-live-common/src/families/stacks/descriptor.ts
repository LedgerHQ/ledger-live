import type { CoinDescriptor } from "../../bridge/descriptor";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {
      memo: {
        type: "text",
        maxLength: 34,
      },
    },
    fees: {
      hasPresets: false,
      hasCustom: true,
    },
  },
};
