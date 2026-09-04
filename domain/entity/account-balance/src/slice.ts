import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AccountId } from "@shared/schema-primitives";
import {
  IDLE_ACCOUNT_BALANCE_STATUS,
  initialAccountBalancesState,
  type AccountBalance,
  type AccountBalanceRows,
  type AccountBalanceStatus,
  type AccountBalancesState,
} from "./schema";

const NO_BALANCES: readonly AccountBalance[] = [];

/**
 * Token-account balances grouped by parent account id.
 *
 * Derived rather than stored: the parent → children link already lives on the rows, so there is
 * nothing to keep in sync and nothing to leak. Memoized on the rows' identity, so the O(n) grouping
 * runs once per balance change instead of once per reading component.
 */
const subBalancesIndex = createSelector(
  (rows: AccountBalanceRows) => rows,
  rows => {
    const index: Record<AccountId, AccountBalance[]> = {};
    for (const balance of Object.values(rows)) {
      if (!balance.parentId) continue;
      const siblings = index[balance.parentId] ?? [];
      siblings.push(balance);
      index[balance.parentId] = siblings;
    }
    return index;
  },
);

export const accountBalancesSlice = createSlice({
  name: "accountBalances",
  initialState: initialAccountBalancesState,
  reducers: {
    /** A read for this account has started. Clears any previous error so a retry shows clean. */
    accountBalanceRequested: (state, { payload }: PayloadAction<AccountId>) => {
      state.status[payload] = { pending: true, sourceId: state.status[payload]?.sourceId };
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
    accountBalanceReceived: (
      state,
      {
        payload,
      }: PayloadAction<{ accountId: AccountId; balances: AccountBalance[]; sourceId: string }>,
    ) => {
      const next = new Set(payload.balances.map(balance => balance.accountId));
      for (const [accountId, balance] of Object.entries(state.rows) as [
        AccountId,
        AccountBalance,
      ][]) {
        const owned = accountId === payload.accountId || balance.parentId === payload.accountId;
        if (owned && !next.has(accountId)) delete state.rows[accountId];
      }
      for (const balance of payload.balances) state.rows[balance.accountId] = balance;
      state.status[payload.accountId] = { pending: false, sourceId: payload.sourceId };
    },

    /** The read failed. Rows are left alone: a stale balance beats no balance. */
    accountBalanceFailed: (
      state,
      { payload }: PayloadAction<{ accountId: AccountId; error: string }>,
    ) => {
      state.status[payload.accountId] = {
        pending: false,
        error: payload.error,
        sourceId: state.status[payload.accountId]?.sourceId,
      };
    },

    /** Drop the given accounts and every token account they parent — on account removal. */
    accountBalancesRemoved: (state, { payload }: PayloadAction<AccountId[]>) => {
      const removed = new Set(payload);
      for (const [accountId, balance] of Object.entries(state.rows) as [
        AccountId,
        AccountBalance,
      ][]) {
        if (removed.has(accountId) || (balance.parentId && removed.has(balance.parentId))) {
          delete state.rows[accountId];
        }
      }
      for (const accountId of payload) delete state.status[accountId];
    },

    /** Empty the table — on profile reset or account-store re-hydration. */
    accountBalancesReset: () => initialAccountBalancesState,
  },

  /**
   * Selectors live with the state they read (RTK 2). Mounted under the slice name, so
   * `accountBalancesSlice.selectors.*` takes the app's root state and `getSelectors()` takes the
   * slice state alone — which is what lets wallet-cli run this reducer over a local variable.
   */
  selectors: {
    /** The account's own balance, `undefined` when it was never read. */
    selectAccountBalance: (
      state: AccountBalancesState,
      accountId: AccountId,
    ): AccountBalance | undefined => state.rows[accountId],

    /** Balances of the token accounts this account parents. Empty when there are none. */
    selectSubAccountBalances: (
      state: AccountBalancesState,
      accountId: AccountId,
    ): readonly AccountBalance[] => subBalancesIndex(state.rows)[accountId] ?? NO_BALANCES,

    /** Outcome of the last read: pending, error, and which source answered. */
    selectAccountBalanceStatus: (
      state: AccountBalancesState,
      accountId: AccountId,
    ): AccountBalanceStatus => state.status[accountId] ?? IDLE_ACCOUNT_BALANCE_STATUS,

    /**
     * When the stored balance was observed, in epoch ms — `undefined` when there is none.
     *
     * Freshness is a property of the row, not of whoever fetched it, which is why it is read back
     * off `at` rather than tracked on the side.
     */
    selectAccountBalanceAt: (
      state: AccountBalancesState,
      accountId: AccountId,
    ): number | undefined => {
      const at = state.rows[accountId]?.at;
      return at === undefined ? undefined : new Date(at).getTime();
    },

    /** The whole table, for consumers that price a portfolio rather than render one account. */
    selectAccountBalanceRows: (state: AccountBalancesState): AccountBalanceRows => state.rows,
  },
});

export const {
  accountBalanceRequested,
  accountBalanceReceived,
  accountBalanceFailed,
  accountBalancesRemoved,
  accountBalancesReset,
} = accountBalancesSlice.actions;

export const {
  selectAccountBalance,
  selectSubAccountBalances,
  selectAccountBalanceStatus,
  selectAccountBalanceAt,
  selectAccountBalanceRows,
} = accountBalancesSlice.selectors;
