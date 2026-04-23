import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { amount } from "./amount";
import { memo } from "./memo";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: { memo },
    fees: {
      hasPresets: false,
      hasCustom: false,
    },
    amount,
  },
};
