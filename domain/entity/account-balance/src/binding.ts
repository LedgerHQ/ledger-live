import type { AccountDataBinding } from "@domain/entity-account-data";
import type { AccountBalance, WithAccountBalances } from "./schema";
import {
  accountBalanceFailed,
  accountBalanceReceived,
  accountBalanceRequested,
  selectAccountBalanceAt,
  selectAccountBalanceStatus,
} from "./slice";

export type AccountBalanceQuery = Record<string, never>;

declare module "@domain/entity-account-data" {
  interface AccountData {
    balance: { query: AccountBalanceQuery; result: AccountBalance[] };
  }
}

export const accountBalanceBinding: AccountDataBinding<"balance", WithAccountBalances> = {
  datum: "balance",
  headQuery: {},
  requested: accountBalanceRequested,
  received: ({ accountId, data, sourceId }) =>
    accountBalanceReceived({ accountId, balances: data, sourceId }),
  failed: accountBalanceFailed,
  selectAt: selectAccountBalanceAt,
  selectPending: (state, accountId) => selectAccountBalanceStatus(state, accountId).pending,
};
