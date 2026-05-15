import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import {
  getDefaultBalance,
  getDefaultRecentTransactions,
  getEmptyTokens,
} from "../../../bridge/descriptor/display/helpers";
import { fees } from "./fees";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {},
    fees,
  },
  display: {
    getBalance: getDefaultBalance,
    getRecentTransactions: getDefaultRecentTransactions,
    hasTokens: false,
    getTokens: getEmptyTokens,
  },
};
