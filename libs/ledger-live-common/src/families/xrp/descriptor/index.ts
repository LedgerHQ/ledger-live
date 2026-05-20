import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import {
  getDefaultBalance,
  getDefaultRecentTransactions,
  getEmptyTokens,
} from "../../../bridge/descriptor/display/helpers";
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
  display: {
    getBalance: getDefaultBalance,
    getRecentTransactions: getDefaultRecentTransactions,
    hasTokens: false,
    getTokens: getEmptyTokens,
  },
};
