import type { CoinDescriptor } from "../../bridge/descriptor";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {
      memo: {
        type: "text",
      },
    },
    fees: {
      hasPresets: false,
      hasCustom: false,
    },
    selfTransfer: "impossible",
  },
};
