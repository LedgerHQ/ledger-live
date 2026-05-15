import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import {
  getDefaultBalance,
  getDefaultRecentTransactions,
  getEmptyTokens,
} from "../../../bridge/descriptor/display/helpers";
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
  display: {
    getBalance: getDefaultBalance,
    getRecentTransactions: getDefaultRecentTransactions,
    hasTokens: false,
    getTokens: getEmptyTokens,
  },
};
