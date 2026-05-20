import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import {
  getDefaultBalance,
  getDefaultRecentTransactions,
  getDefaultTokens,
} from "../../../bridge/descriptor/display/helpers";
import { memo } from "./memo";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: { memo },
    fees: {
      hasPresets: false,
      hasCustom: false,
    },
    selfTransfer: "free",
  },
  display: {
    getBalance: getDefaultBalance,
    getRecentTransactions: getDefaultRecentTransactions,
    hasTokens: true,
    getTokens: getDefaultTokens,
  },
};
