import type { CoinDescriptor } from "../../bridge/descriptor";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {
      recipientSupportsDomain: true,
    },
    fees: {
      hasPresets: true,
      hasCustom: true,
    },
    selfTransfer: "free",
    errors: {
      userRefusedTransaction: "UserRefusedOnDevice",
    },
  },
};
