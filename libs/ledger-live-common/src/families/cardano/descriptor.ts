import type { CoinDescriptor } from "../../bridge/descriptor";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {
      memo: {
        type: "text",
        maxLength: 64,
      },
    },
    fees: {
      hasPresets: false,
      hasCustom: false,
    },
    selfTransfer: "free",
  },
};
