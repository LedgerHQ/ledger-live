import type { CoinDescriptor } from "../../bridge/descriptor";
import { StellarMemoType } from "@ledgerhq/coin-stellar/types/bridge";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {
      memo: {
        type: "typed",
        options: StellarMemoType,
        defaultOption: "MEMO_TEXT",
      },
    },
    fees: {
      hasPresets: false,
      hasCustom: true,
    },
    errors: {
      userRefusedTransaction: "StellarUserRefusedError",
    },
  },
};
