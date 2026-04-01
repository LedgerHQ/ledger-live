import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { errors } from "./errors";
import { memo } from "./memo";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: { memo },
    fees: {
      hasPresets: false,
      hasCustom: false,
    },
    errors,
  },
};
