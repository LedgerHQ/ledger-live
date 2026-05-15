import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import {
  getDefaultBalance,
  getDefaultRecentTransactions,
  getDefaultTokens,
} from "../../../bridge/descriptor/display/helpers";
import { evmSendDescriptor } from "./send/descriptor";

export const descriptor: CoinDescriptor = {
  send: evmSendDescriptor,
  display: {
    getBalance: getDefaultBalance,
    getRecentTransactions: getDefaultRecentTransactions,
    hasTokens: true,
    getTokens: getDefaultTokens,
  },
};
