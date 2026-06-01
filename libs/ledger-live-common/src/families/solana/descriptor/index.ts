import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { memo } from "./memo";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: { memo },
    fees: {
      hasPresets: false,
      hasCustom: false,
    },
    errors: {
      userRefusedTransaction: "UserRefusedOnDevice",
      userRefusedTransactionStatusCodes: ["6985"],
    },
  },
};
