import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import {
  getDefaultBalance,
  getDefaultRecentTransactions,
  getDefaultTokens,
} from "../../../bridge/descriptor/display/helpers";
import { errors } from "./errors";
import { fees } from "./fees";
import { memo } from "./memo";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: { memo },
    fees,
    errors,
  },
  display: {
    getBalance: getDefaultBalance,
    getRecentTransactions: getDefaultRecentTransactions,
    hasTokens: true,
    getTokens: getDefaultTokens,
  },
};
