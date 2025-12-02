import type { CoinDescriptor } from "../../bridge/descriptor";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {
      memo: {
        type: "text",
        maxLength: 1000,
      },
    },
    fees: {
      hasPresets: false,
      hasCustom: false,
    },
    selfTransfer: "impossible",
  },
};
