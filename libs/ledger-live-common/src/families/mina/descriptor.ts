import type { CoinDescriptor } from "../../bridge/descriptor";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {
      memo: {
        type: "text",
        maxLength: 32,
      },
    },
    fees: {
      hasPresets: false,
      hasCustom: false,
    },
    selfTransfer: "impossible",
  },
};
