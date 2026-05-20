import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import {
  getDefaultBalance,
  getDefaultRecentTransactions,
  getDefaultTokens,
} from "../../../bridge/descriptor/display/helpers";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {},
    fees: {
      hasPresets: false,
      hasCustom: false,
    },
    selfTransfer: "warning",
  },
  display: {
    getBalance: getDefaultBalance,
    getRecentTransactions: getDefaultRecentTransactions,
    hasTokens: true,
    getTokens: getDefaultTokens,
  },
};
