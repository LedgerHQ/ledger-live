import type { CoinDescriptor } from "@ledgerhq/coin-framework/features/types";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {
      recipientSupportsDomain: true,
    },
    fees: {
      hasPresets: true,
      hasCustom: true,
    },
  },
};
