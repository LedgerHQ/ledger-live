import type { CoinDescriptor } from "../../../bridge/descriptor/types";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {},
    fees: {
      hasPresets: false,
      hasCustom: false,
      feeAssetId: "vechain/vip180/vtho",
    },
    selfTransfer: "warning",
  },
};
