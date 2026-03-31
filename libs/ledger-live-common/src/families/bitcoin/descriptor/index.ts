import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { bitcoinCoinControlConfig } from "./coinControl";
import { fees } from "./fees";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {},
    fees: {
      ...fees,
      coinControl: bitcoinCoinControlConfig,
    },
    selfTransfer: "free",
  },
};
