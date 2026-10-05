import type { AccountDataBinding } from "@domain/entity-account-data";
import type { AccountBalance, WithAccountBalances } from "./schema";
import {
  accountBalanceFailed,
  accountBalanceReceived,
  accountBalanceRequested,
  selectAccountBalanceAt,
  selectAccountBalanceStatus,
} from "./slice";

declare module "@domain/entity-account-data" {
  interface AccountData {
    /** The account's own row first, then one per token account. */
    balance: { query: undefined; result: AccountBalance[] };
  }
}

export const accountBalanceBinding: AccountDataBinding<"balance", WithAccountBalances> = {
  datum: "balance",
  requested: accountBalanceRequested,
  received: accountBalanceReceived,
  failed: accountBalanceFailed,
  selectAt: selectAccountBalanceAt,
  selectPending: (state, accountId) => selectAccountBalanceStatus(state, accountId).pending,
  selectSourceId: (state, accountId) => selectAccountBalanceStatus(state, accountId).sourceId,
};
