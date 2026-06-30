import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { memo } from "./memo";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: { memo },
    fees: {
      hasPresets: false,
      hasCustom: false,
    },
    // Self-send is valid on-chain but almost always a mistake — warn without blocking. LIVE-33176.
    selfTransfer: "warning",
  },
};
