import type { CoinDescriptor } from "../../bridge/descriptor";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {},
    fees: {
      hasPresets: true,
      hasCustom: true,
      hasCoinControl: true,
    },
    selfTransfer: "free",
  },
};
