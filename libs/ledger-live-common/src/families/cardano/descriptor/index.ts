import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { memo } from "./memo";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: { memo },
    fees: {
      hasPresets: false,
      hasCustom: false,
    },
    // A Cardano self-send is valid on-chain (funds return to one of the account's own UTXOs) but
    // is almost always a mistake, so warn without blocking — mirrors vechain/near (LIVE-33176).
    selfTransfer: "warning",
  },
};
