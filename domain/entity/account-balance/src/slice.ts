import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AccountId } from "@shared/schema-primitives";
import { initialAccountBalancesState, type AccountBalance } from "./schema";

export const accountBalancesSlice = createSlice({
  name: "accountBalances",
  initialState: initialAccountBalancesState,
  reducers: {
    /**
     * Insert or overwrite the given rows, leaving every other row alone.
     *
     * Use it when a source delivered a partial view — a single token account's balance, say. It
     * cannot express "this token account is gone": use {@link replaceAccountBalances} for that.
     */
    upsertAccountBalances: (state, { payload }: PayloadAction<AccountBalance[]>) => {
      for (const balance of payload) state[balance.accountId] = balance;
    },

    /**
     * Replace, in one action, an account's own balance and the full set of its token-account
     * balances.
     *
     * Atomic on purpose: a chain that returns every asset a single address holds in one call (EVM
     * and friends) reports a token swept to zero by *omitting* it, not by sending a zero. Diffing
     * here is what stops that token's row from freezing at its pre-sweep value forever, and what
     * keeps orphan rows out of the table.
     */
    replaceAccountBalances: (
      state,
      { payload }: PayloadAction<{ accountId: AccountId; balances: AccountBalance[] }>,
    ) => {
      const next = new Set(payload.balances.map(b => b.accountId));
      for (const [accountId, balance] of Object.entries(state) as [AccountId, AccountBalance][]) {
        const owned = accountId === payload.accountId || balance.parentId === payload.accountId;
        if (owned && !next.has(accountId)) delete state[accountId];
      }
      for (const balance of payload.balances) state[balance.accountId] = balance;
    },

    /** Drop the given accounts and every token account they parent — on account removal. */
    removeAccountBalances: (state, { payload }: PayloadAction<AccountId[]>) => {
      const removed = new Set(payload);
      for (const [accountId, balance] of Object.entries(state) as [AccountId, AccountBalance][]) {
        if (removed.has(accountId) || (balance.parentId && removed.has(balance.parentId))) {
          delete state[accountId];
        }
      }
    },

    /** Empty the table — on profile reset or account-store re-hydration. */
    resetAccountBalances: () => initialAccountBalancesState,
  },
});

export const {
  upsertAccountBalances,
  replaceAccountBalances,
  removeAccountBalances,
  resetAccountBalances,
} = accountBalancesSlice.actions;
